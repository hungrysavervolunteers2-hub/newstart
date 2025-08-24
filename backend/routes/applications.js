const express = require('express');
const Application = require('../models/Application');
const Project = require('../models/Project');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateApplication } = require('../middleware/validation');
const { sendApplicationApprovalEmail, sendApplicationRejectionEmail } = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/applications
// @desc    Create a new application
// @access  Private (User only)
router.post('/', authenticateToken, validateApplication, async (req, res, next) => {
  try {
    const { projectId } = req.body;

    // Check if project exists and is approved
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply to non-approved projects'
      });
    }

    // Check if user already applied to this project
    const existingApplication = await Application.findOne({
      projectId,
      userId: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project'
      });
    }

    // Create application
    const application = await Application.create({
      projectId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      projectName: project.name
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/applications/my
// @desc    Get all applications for current user
// @access  Private (User only)
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('projectId', 'name description startDate endDate budget status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/applications
// @desc    Get all applications (admin only)
// @access  Private (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { projectId } = req.query;
    let query = {};

    if (projectId) {
      query.projectId = projectId;
    }

    const applications = await Application.find(query)
      .populate('projectId', 'name description startDate endDate budget status')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/applications/:id/approve
// @desc    Approve an application
// @access  Private (Admin only)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = 'approved';
    await application.save();

    // Send approval email (don't wait for it)
    sendApplicationApprovalEmail(
      application.userEmail,
      application.userName,
      application.projectName
    ).catch(err => {
      console.error('Failed to send application approval email:', err);
    });

    res.json({
      success: true,
      message: 'Application approved successfully',
      application
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/applications/:id/reject
// @desc    Reject an application
// @access  Private (Admin only)
router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = 'rejected';
    await application.save();

    // Send rejection email (don't wait for it)
    sendApplicationRejectionEmail(
      application.userEmail,
      application.userName,
      application.projectName
    ).catch(err => {
      console.error('Failed to send application rejection email:', err);
    });

    res.json({
      success: true,
      message: 'Application rejected successfully',
      application
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;