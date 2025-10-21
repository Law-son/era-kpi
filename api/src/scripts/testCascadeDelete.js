import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Company from '../models/Company.js';

const testCascadeDelete = async () => {
  try {
    console.log('Testing cascade delete functionality...');
    
    // Create a test company
    const company = new Company({
      name: 'Test Company for Cascade Delete',
      industry: 'Technology',
      size: 'Medium'
    });
    await company.save();
    console.log('Created test company:', company._id);
    
    // Create a test executive
    const executive = new User({
      name: 'Test Executive',
      email: 'testexec@example.com',
      password: 'TestPassword123!',
      role: 'executive',
      company: company._id
    });
    await executive.save();
    console.log('Created test executive:', executive._id);
    
    // Create some test tasks assigned to the executive
    const tasks = [];
    for (let i = 1; i <= 3; i++) {
      const task = new Task({
        title: `Test Task ${i}`,
        description: `This is test task ${i}`,
        assignedTo: executive._id,
        assignedBy: executive._id, // Using executive as assignedBy for simplicity
        company: company._id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'medium',
        reportLink: 'https://example.com',
        status: 'pending'
      });
      await task.save();
      tasks.push(task);
      console.log(`Created test task ${i}:`, task._id);
    }
    
    console.log(`Created ${tasks.length} tasks for executive`);
    
    // Now delete the executive and verify cascade delete
    console.log('Deleting executive...');
    const assignedTasksBefore = await Task.find({ assignedTo: executive._id });
    console.log(`Tasks assigned to executive before deletion: ${assignedTasksBefore.length}`);
    
    // Delete the executive (this should trigger cascade delete)
    await User.findByIdAndDelete(executive._id);
    console.log('Executive deleted');
    
    // Check if tasks were deleted
    const assignedTasksAfter = await Task.find({ assignedTo: executive._id });
    console.log(`Tasks assigned to executive after deletion: ${assignedTasksAfter.length}`);
    
    if (assignedTasksAfter.length === 0) {
      console.log('✅ Cascade delete working correctly - all tasks were deleted');
    } else {
      console.log('❌ Cascade delete failed - tasks still exist');
    }
    
    // Clean up test data
    await Company.findByIdAndDelete(company._id);
    console.log('Cleaned up test data');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => testCascadeDelete())
    .catch(console.error);
}

export default testCascadeDelete;
