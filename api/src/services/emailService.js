// Email service for sending weekly reports and notifications
// This is a placeholder implementation - in production, you would integrate with a real email service

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const emailJsServiceId = process.env.EMAILJS_SERVICE_ID || process.env.serviceId;
const emailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID || process.env.templateId;
const emailJsUserId = process.env.EMAILJS_USER_ID || process.env.userId;
const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';

export const generateWeeklyReports = async () => {
  try {
    console.log('Generating weekly reports...');
    
    // This would typically:
    // 1. Query the database for weekly performance data
    // 2. Generate reports for each company
    // 3. Send emails to relevant users
    
    // Placeholder implementation
    const reports = {
      timestamp: new Date(),
      status: 'completed',
      message: 'Weekly reports generated successfully'
    };
    
    console.log('Weekly reports generated:', reports);
    return reports;
  } catch (error) {
    console.error('Error generating weekly reports:', error);
    throw error;
  }
};

export const sendNotification = async (to, subject, content) => {
  try {
    console.log(`Sending notification to ${to}: ${subject}`);
    
    // This would typically integrate with services like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
    // Placeholder implementation
    const emailData = {
      to,
      subject,
      content,
      sentAt: new Date(),
      status: 'sent'
    };
    
    console.log('Email sent:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendTaskReminder = async (userId, taskId) => {
  try {
    // This would send reminder emails for overdue tasks
    console.log(`Sending task reminder to user ${userId} for task ${taskId}`);
    
    // Placeholder implementation
    return {
      userId,
      taskId,
      sentAt: new Date(),
      status: 'sent'
    };
  } catch (error) {
    console.error('Error sending task reminder:', error);
    throw error;
  }
}; 

export const sendAdminAddedEmail = async ({ toEmail, toName, subject, message }) => {
  try {
    const url = 'https://api.emailjs.com/api/v1.0/email/send';

    if (!emailJsServiceId || !emailJsTemplateId || !emailJsUserId) {
      console.error('EmailJS env vars missing:', {
        EMAILJS_SERVICE_ID: Boolean(process.env.EMAILJS_SERVICE_ID),
        EMAILJS_TEMPLATE_ID: Boolean(process.env.EMAILJS_TEMPLATE_ID),
        EMAILJS_USER_ID: Boolean(process.env.EMAILJS_USER_ID),
        serviceId: Boolean(process.env.serviceId),
        templateId: Boolean(process.env.templateId),
        userId: Boolean(process.env.userId),
      });
    }

    const payload = {
      service_id: emailJsServiceId,
      template_id: emailJsTemplateId,
      user_id: emailJsUserId,
      template_params: {
        to_email: toEmail,
        from_name: 'ERA KPI Tracker',
        to_name: toName,
        reply_to: 'no-reply@era-kpi.local',
        subject,
        message,
        dashboard_url: dashboardUrl,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        origin: dashboardUrl,
        'Content-Type': 'application/json',
      },
    });

    console.log('EmailJS send result:', response.data);
    return true;
  } catch (error) {
    console.error('EmailJS send failed:', error?.response?.data || error?.message || error);
    return false;
  }
}; 