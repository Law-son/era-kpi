import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';

const cleanupTasks = async () => {
  try {
    console.log('Starting task cleanup...');
    
    // Find all tasks
    const tasks = await Task.find({}).populate('assignedTo');
    
    console.log(`Found ${tasks.length} tasks to check`);
    
    let invalidTasks = 0;
    let fixedTasks = 0;
    
    for (const task of tasks) {
      if (!task.assignedTo) {
        console.log(`Task ${task._id} has invalid assignedTo reference`);
        invalidTasks++;
        
        // Try to find a valid user to assign to
        const validUsers = await User.find({ role: 'executive', company: task.company });
        if (validUsers.length > 0) {
          // Assign to the first available executive
          task.assignedTo = validUsers[0]._id;
          await task.save();
          console.log(`Fixed task ${task._id} by assigning to ${validUsers[0].name}`);
          fixedTasks++;
        } else {
          console.log(`No valid executives found for task ${task._id}, marking for deletion`);
          // Optionally delete the task if no valid assignee found
          // await Task.findByIdAndDelete(task._id);
        }
      }
    }
    
    console.log(`Cleanup complete: ${invalidTasks} invalid tasks found, ${fixedTasks} fixed`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => cleanupTasks())
    .catch(console.error);
}

export default cleanupTasks;
