const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to Projectify!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Welcome to Projectify, ${userName}! 🎉</h2>
        <p>Thank you for joining our platform! We're excited to have you on board.</p>
        
        <h3>What's Next?</h3>
        <ul>
          <li>Browse available projects in your dashboard</li>
          <li>Apply to projects that match your skills</li>
          <li>Track your application status</li>
          <li>Get notified when projects are approved</li>
        </ul>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0;"><strong>Happy project hunting!</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">The Projectify Team</p>
        </div>
      </div>
    `
  }),

  projectApproved: (projectName, projectDescription, startDate, endDate) => ({
    subject: `Great News! Project "${projectName}" has been approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Project Approved!</h2>
        <p>We're excited to inform you that the project you applied to has been approved!</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #10b981; margin-top: 0;">${projectName}</h3>
          <p><strong>Description:</strong> ${projectDescription}</p>
          <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        </div>
        
        <p>You can now proceed with your application. Check your dashboard for more details and next steps.</p>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0;"><strong>Good luck with your application!</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">The Projectify Team</p>
        </div>
      </div>
    `
  }),

  applicationApproved: (userName, projectName) => ({
    subject: `Your application for "${projectName}" has been approved!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Congratulations ${userName}!</h2>
        <p>We're thrilled to inform you that your application has been <strong>approved</strong>!</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #10b981; margin-top: 0;">Project: ${projectName}</h3>
          <p>Your application has been reviewed and accepted. You're now part of this exciting project!</p>
        </div>
        
        <h3>Next Steps:</h3>
        <ul>
          <li>Check your dashboard for project details</li>
          <li>You may be contacted by the project team soon</li>
          <li>Prepare for the project kickoff</li>
        </ul>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0;"><strong>Welcome to the team!</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">The Projectify Team</p>
        </div>
      </div>
    `
  }),

  applicationRejected: (userName, projectName) => ({
    subject: `Update on your application for "${projectName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Application Update</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for your interest in the "${projectName}" project. After careful consideration, we've decided to move forward with other candidates for this particular opportunity.</p>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Don't let this discourage you!</strong> There are many other exciting projects available on our platform.</p>
        </div>
        
        <h3>Keep Going:</h3>
        <ul>
          <li>Browse more projects that match your skills</li>
          <li>Apply to multiple projects to increase your chances</li>
          <li>Update your profile to stand out</li>
          <li>New projects are added regularly</li>
        </ul>
        
        <p>We encourage you to continue exploring opportunities on Projectify. Your perfect project match is out there!</p>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0;"><strong>Keep applying and stay positive!</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">The Projectify Team</p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);
    
    if (!emailContent) {
      throw new Error(`Email template '${template}' not found`);
    }

    const mailOptions = {
      from: `"Projectify" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  return await sendEmail(userEmail, 'welcome', userName);
};

// Send project approval email
const sendProjectApprovalEmail = async (userEmail, projectName, projectDescription, startDate, endDate) => {
  return await sendEmail(userEmail, 'projectApproved', { projectName, projectDescription, startDate, endDate });
};

// Send application approval email
const sendApplicationApprovalEmail = async (userEmail, userName, projectName) => {
  return await sendEmail(userEmail, 'applicationApproved', { userName, projectName });
};

// Send application rejection email
const sendApplicationRejectionEmail = async (userEmail, userName, projectName) => {
  return await sendEmail(userEmail, 'applicationRejected', { userName, projectName });
};

module.exports = {
  sendWelcomeEmail,
  sendProjectApprovalEmail,
  sendApplicationApprovalEmail,
  sendApplicationRejectionEmail
};