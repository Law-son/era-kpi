import express from 'express';
import Task from '../models/Task.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { sendAdminAddedEmail } from '../services/emailService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { company, assignedTo, status } = req.query;
    let filter = {};
    
    console.log('[TASKS] Request query:', req.query);
    console.log('[TASKS] Requesting user:', req.user?.email, 'Role:', req.user?.role, 'Company:', req.user?.company?._id);
    
    // Determine filtering logic based on user role
    if (req.user.role === 'superadmin') {
      // Superadmin can see all tasks
      console.log('[TASKS] Superadmin - showing all tasks');
    } else if (req.user.role === 'admin') {
      // Admin should see tasks from their company OR tasks they created
      const orFilters = [];
      if (company) {
        if (!mongoose.Types.ObjectId.isValid(company)) {
          return res.status(400).json({ message: 'Invalid company id' });
        }
        orFilters.push({ company });
        console.log('[TASKS] Admin filtering by provided company:', company);
      } else if (req.user.company) {
        const userCompanyId = (req.user.company._id || req.user.company.id || req.user.company)?.toString?.();
        if (userCompanyId) {
          orFilters.push({ company: userCompanyId });
          console.log('[TASKS] Admin filtering by user company:', userCompanyId);
        }
      }
      orFilters.push({ assignedBy: req.user._id });
      filter = orFilters.length > 1 ? { $or: orFilters } : (orFilters[0] || {});
    } else if (req.user.role === 'executive') {
      // Executive should only see tasks assigned to them
      filter.assignedTo = req.user._id;
      console.log('[TASKS] Executive - showing tasks assigned to them');
    }
    
    // Apply additional filters
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    
    console.log('[TASKS] Final filter:', filter);
    
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('company', 'name')
      .populate('comments.author', 'name role')
      .sort({ createdAt: -1 });
    
    console.log('[TASKS] Found tasks:', tasks.length);
    tasks.forEach(task => {
      console.log(`[TASKS] Task ${task._id}: status=${task.status}, hasScoring=${!!task.scoring}, company=${task.company?._id}, assignedBy=${task.assignedBy?._id}`);
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('[TASKS] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('company', 'name')
      .populate('comments.author', 'name role');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new task
router.post('/', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority, company, reportLink } = req.body;
    
    console.log('[TASKS] Creating task:', { 
      title, 
      assignedTo, 
      company, 
      assignedBy: req.user._id,
      userRole: req.user.role 
    });
    
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id, // Use authenticated user as creator
      deadline,
      priority,
      company,
      reportLink,
      status: 'pending'
    });
    
    const savedTask = await task.save();
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('company', 'name');
    
    console.log('[TASKS] Task created successfully:', populatedTask._id);
    
    // Notify assigned executive via email (fire-and-forget)
    try {
      const exec = await User.findById(assignedTo).select('name email');
      if (exec?.email) {
        const subject = `[Task Assigned] ${title}`;
        const message = `Hello ${exec.name},\n\n` +
          `You have been assigned a new task:\n` +
          `Title: ${title}\n` +
          `Priority: ${priority}\n` +
          `Deadline: ${new Date(deadline).toLocaleString()}\n\n` +
          `Description:\n${description}\n\n` +
          `Please log in to view details and start working on it.` + (reportLink ? `\n\nReport Link: ${reportLink}` : '');
        sendAdminAddedEmail({ toEmail: exec.email, toName: exec.name, subject, message }).catch(() => {});
      }
    } catch (emailErr) {
      // Do not fail the response due to email issues
      console.error('Failed to send task assignment email:', emailErr);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('[TASKS] Error creating task:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority, status, reportLink } = req.body;

    const original = await Task.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, deadline, priority, status, reportLink },
      { new: true, runValidators: true, context: 'query' }
    ).populate('assignedTo', 'name email').populate('company', 'name');

    // If reassigned, notify new executive
    try {
      const originalAssignee = original.assignedTo?.toString?.();
      const newAssignee = (assignedTo || updated.assignedTo?._id || updated.assignedTo)?.toString?.();
      if (newAssignee && originalAssignee !== newAssignee) {
        const exec = await User.findById(newAssignee).select('name email');
        if (exec?.email) {
          const subject = `[Task Assigned] ${updated.title}`;
          const message = `Hello ${exec.name},\n\n` +
            `You have been assigned a task:\n` +
            `Title: ${updated.title}\n` +
            `Priority: ${updated.priority}\n` +
            `Deadline: ${new Date(updated.deadline).toLocaleString()}\n\n` +
            `Description:\n${updated.description}\n\n` +
            `Please log in to view details.` + (updated.reportLink ? `\n\nReport Link: ${updated.reportLink}` : '');
          sendAdminAddedEmail({ toEmail: exec.email, toName: exec.name, subject, message }).catch(() => {});
        }
      }
    } catch (emailErr) {
      console.error('Failed to send reassignment email:', emailErr);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit task by executive
router.put('/:id/submit', authenticate, authorize(['executive']), async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Ensure the logged-in executive is the assignee
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to submit this task' });
    }

    task.submission = {
      content: content || '',
      submittedAt: new Date(),
    };
    task.status = 'submitted';

    // Don't set scoring object yet - let admin do the full scoring
    // The time score will be calculated when admin scores the task

    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('company', 'name')
      .populate('comments.author', 'name role');

    // Notify the admin who assigned the task about completion (fire-and-forget)
    try {
      const assignedByAdmin = await User.findById(task.assignedBy).select('name email role');
      
      if (assignedByAdmin && assignedByAdmin.role === 'admin' && assignedByAdmin.email) {
        const executive = populated.assignedTo;
        const company = populated.company;
        const subject = `[Task Submitted] ${task.title}`;
        const message = `Hello ${assignedByAdmin.name},\n\n` +
          `Executive ${executive.name} has submitted the task you assigned for review:\n\n` +
          `Task: ${task.title}\n` +
          `Company: ${company.name}\n` +
          `Executive: ${executive.name}\n` +
          `Priority: ${task.priority}\n` +
          `Deadline: ${new Date(task.deadline).toLocaleString()}\n` +
          `Submitted: ${new Date(task.submission.submittedAt).toLocaleString()}\n\n` +
          `Submission Content:\n${task.submission.content}\n\n` +
          `Please log in to review and score this task.`;
        
        await sendAdminAddedEmail({ 
          toEmail: assignedByAdmin.email, 
          toName: assignedByAdmin.name, 
          subject, 
          message 
        }).catch(err => console.error(`Failed to send notification to assigned admin ${assignedByAdmin.email}:`, err));
        
        console.log(`Sent task completion notification to assigned admin ${assignedByAdmin.name} for task: ${task.title}`);
      } else {
        console.log(`No valid assigned admin found for task: ${task.title} (assignedBy: ${task.assignedBy})`);
      }
    } catch (emailErr) {
      // Do not fail the response due to email issues
      console.error('Failed to send task completion notification:', emailErr);
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Score task by admin with KPI calculation
router.put('/:id/score', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { qualityScore, initiativeScore, feedback, comment } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.status !== 'submitted' && task.status !== 'completed') {
      return res.status(400).json({ message: 'Task must be submitted before scoring' });
    }

    // Validate score ranges
    if (qualityScore !== undefined && (qualityScore < 0 || qualityScore > 10)) {
      return res.status(400).json({ message: 'Quality score must be between 0 and 10' });
    }
    if (initiativeScore !== undefined && (initiativeScore < 0 || initiativeScore > 10)) {
      return res.status(400).json({ message: 'Initiative score must be between 0 and 10' });
    }

    const timeScore = task.calculateTimeScore();

    task.scoring = {
      ...(task.scoring || {}),
      qualityScore: typeof qualityScore === 'number' ? qualityScore : task.scoring?.qualityScore,
      initiativeScore: typeof initiativeScore === 'number' ? initiativeScore : task.scoring?.initiativeScore,
      timeScore,
      feedback: feedback ?? task.scoring?.feedback,
      scoredBy: req.user.id,
      scoredAt: new Date(),
    };

    const total = task.calculateTotalScore();
    task.scoring.totalScore = Math.round(total * 10) / 10; // 1 decimal
    task.status = 'completed';

    if (comment && String(comment).trim()) {
      task.comments = task.comments || [];
      task.comments.push({
        author: req.user.id,
        role: req.user.role,
        text: String(comment).trim(),
        createdAt: new Date(),
      });
    }

    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('company', 'name')
      .populate('comments.author', 'name role');

    // Notify the executive about their task score (fire-and-forget)
    try {
      const executive = populated.assignedTo;
      const company = populated.company;
      const admin = req.user;
      
      if (executive?.email) {
        const subject = `[Task Scored] ${task.title} - Score: ${task.scoring.totalScore}/10`;
        const message = `Hello ${executive.name},\n\n` +
          `Your task has been reviewed and scored by ${admin.name}:\n\n` +
          `Task: ${task.title}\n` +
          `Company: ${company.name}\n` +
          `Final Score: ${task.scoring.totalScore}/10\n\n` +
          `Score Breakdown:\n` +
          `• Quality Score: ${task.scoring.qualityScore}/10\n` +
          `• Time Score: ${task.scoring.timeScore}/10\n` +
          `• Initiative Score: ${task.scoring.initiativeScore}/10\n\n` +
          `Feedback: ${task.scoring.feedback || 'No specific feedback provided'}\n\n` +
          `Please log in to view your performance dashboard and see how this affects your overall ranking.\n\n` +
          `Best regards,\n${admin.name}`;
        
        await sendAdminAddedEmail({ 
          toEmail: executive.email, 
          toName: executive.name, 
          subject, 
          message 
        }).catch(err => console.error(`Failed to send score notification to executive ${executive.email}:`, err));
        
        console.log(`Sent task score notification to executive ${executive.name} for task: ${task.title}`);
      } else {
        console.log(`No valid executive email found for task: ${task.title} (assignedTo: ${task.assignedTo})`);
      }
    } catch (emailErr) {
      // Do not fail the response due to email issues
      console.error('Failed to send task score notification:', emailErr);
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks by user (executive)
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    // Only allow the user themselves or admins to view
    if (req.user.role === 'executive' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const tasks = await Task.find({ assignedTo: userId })
      .populate('assignedTo', 'name email')
      .populate('company', 'name')
      .populate('comments.author', 'name role')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 