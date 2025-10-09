import User from '../models/User.js';
import Company from '../models/Company.js';
import Badge from '../models/Badge.js';

export const seedSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@gmail.com' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Create super admin
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'superadmin@gmail.com',
      password: 'Super@admin25',
      role: 'superadmin',
      mustChangePassword: false,
    });

    await superAdmin.save();
    console.log('Super admin created successfully');

    // Create ERA AXIS company
    const existingCompany = await Company.findOne({ name: 'ERA AXIS' });
    if (!existingCompany) {
      const eraAxis = new Company({
        name: 'ERA AXIS',
        industry: 'Technology',
        description: 'Leading technology company focused on innovation and excellence',
      });
      await eraAxis.save();
      console.log('ERA AXIS company created successfully');
    }

    // Seed default badges
    await seedBadges();

  } catch (error) {
    console.error('Seed super admin error:', error);
  }
};

const seedBadges = async () => {
  try {
    const badges = [
      {
        name: 'Top Performer',
        description: 'Awarded to the highest scoring executive of the month',
        icon: '🏆',
        criteria: 'Highest monthly score',
        type: 'auto',
      },
      {
        name: 'Most Improved',
        description: 'Awarded to the executive with the highest performance improvement',
        icon: '📈',
        criteria: 'Highest performance jump from last month',
        type: 'auto',
      },
      {
        name: 'Fast Finisher',
        description: 'Awarded to the executive with the most early task completions',
        icon: '⚡',
        criteria: 'Most early task completions',
        type: 'auto',
      },
      {
        name: 'Consistency Champion',
        description: 'Awarded for maintaining high performance over time',
        icon: '👑',
        criteria: '≥ 8.0 score for 3 months in a row',
        type: 'auto',
      },
      {
        name: 'Rising Leader',
        description: 'Awarded to new executives showing exceptional performance',
        icon: '🚀',
        criteria: 'Strong performance from new exec',
        type: 'manual',
      },
      {
        name: 'Team Player',
        description: 'Awarded for exceptional collaboration and teamwork',
        icon: '🤝',
        criteria: 'Exceptional collaboration',
        type: 'manual',
      },
    ];

    for (const badgeData of badges) {
      const existingBadge = await Badge.findOne({ name: badgeData.name });
      if (!existingBadge) {
        const badge = new Badge(badgeData);
        await badge.save();
      }
    }

    console.log('Default badges seeded successfully');
  } catch (error) {
    console.error('Seed badges error:', error);
  }
};