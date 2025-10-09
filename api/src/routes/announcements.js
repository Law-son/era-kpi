import express from 'express';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { sendAdminAddedEmail } from '../services/emailService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all announcements
router.get('/', authenticate, async (req, res) => {
  try {
    const { company } = req.query;
    const filter = { isActive: true };
    
    console.log('[ANNOUNCEMENTS] Request query:', req.query);
    console.log('[ANNOUNCEMENTS] Requesting user:', req.user?.email, 'Company:', req.user?.company?._id);
    
    if (company) {
      filter.company = company;
      console.log('[ANNOUNCEMENTS] Filtering by company:', company);
    }
    
    console.log('[ANNOUNCEMENTS] Final filter:', filter);
    
    const announcements = await Announcement.find(filter)
      .populate('company', 'name')
      .populate('author', 'name')
      .sort({ isPinned: -1, createdAt: -1 }); // Pinned announcements first, then by date
    
    console.log('[ANNOUNCEMENTS] Found announcements:', announcements.length);
    
    res.json(announcements);
  } catch (error) {
    console.error('[ANNOUNCEMENTS] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get announcement by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('company', 'name')
      .populate('author', 'name');
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new announcement
router.post('/', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    console.log('Announcement creation req.body:', req.body); // Debug log
    const { title, content, company, priority } = req.body;
    
    const announcement = new Announcement({
      title,
      content,
      company,
      priority,
      author: req.user.id
    });
    
    const savedAnnouncement = await announcement.save();
    const populatedAnnouncement = await Announcement.findById(savedAnnouncement._id)
      .populate('company', 'name')
      .populate('author', 'name');

    // Send announcement emails to company executives in batches of 10
    try {
      if (company) {
        const executives = await User.find({ company, role: 'executive', isActive: true }).select('name email');
        const totalRecipients = executives.length;
        console.log(`Announcement email distribution: ${totalRecipients} recipients (company=${company})`);

        const batchSize = 10;
        for (let i = 0; i < executives.length; i += batchSize) {
          const batch = executives.slice(i, i + batchSize);
          await Promise.all(
            batch.map((exec) =>
              sendAdminAddedEmail({
                toEmail: exec.email,
                toName: exec.name,
                subject: `[Announcement] ${title}`,
                message: content,
              })
            )
          );
          console.log(`Sent announcement batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);
        }
      }
    } catch (emailErr) {
      console.error('Error sending announcement emails:', emailErr);
      // Do not fail the API response due to email issues
    }

    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update announcement
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { title, content, priority, isActive, isPinned } = req.body;
    
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, priority, isActive, isPinned },
      { new: true }
    ).populate('company', 'name').populate('author', 'name');
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle pin status of announcement
router.put('/:id/pin', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('company', 'name')
      .populate('author', 'name');
    
    res.json(populatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete announcement
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 