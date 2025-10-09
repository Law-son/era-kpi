import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Import routes
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import leaderboardRoutes from './routes/leaderboard.js';
import announcementRoutes from './routes/announcements.js';
import kpiRoutes from './routes/kpi.js';
import badgeRoutes from './routes/badges.js';

// Import services
import { seedSuperAdmin } from './services/seedService.js';
import { generateWeeklyReports } from './services/emailService.js';
import { generateMonthlyLeaderboard } from './services/leaderboardService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/badges', badgeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'ERA AXIS KPI Tracker API is running!' });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong!' });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed super admin
    await seedSuperAdmin();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

// Schedule weekly email reports every Sunday at 9 AM
cron.schedule('0 9 * * 0', async () => {
  console.log('Generating weekly reports...');
  await generateWeeklyReports();
});

// Schedule monthly leaderboard generation on the 1st of each month at 1 AM
cron.schedule('0 1 1 * *', async () => {
  console.log('Generating monthly leaderboard...');
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  await generateMonthlyLeaderboard(lastMonth.getFullYear(), lastMonth.getMonth() + 1);
});