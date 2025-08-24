const express = require('express');
const Project = require('../models/Project');
const Application = require('../models/Application');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');
const { sendProjectApprovalEmail } = require('../utils/emailService');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get projects based on user role and query
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};

    if (req.user.role === 'admin') {
      // Admin can see all projects or filter by status
      if (status && status !== 'all') {
        query.status = status;
      }
    } else {
      // Regular users can only see approved projects
      query.status = 'approved';
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Admin only)
router.post('/', authenticateToken, requireAdmin, validateProject, async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, budget } = req.body;

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      budget,
      createdBy: req.user._id
    });

    await project.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id/approve
// @desc    Approve a project
// @access  Private (Admin only)
router.put('/:id/approve', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.status = 'approved';
    await project.save();

    // Get all users who applied to this project
    const applications = await Application.find({ projectId: project._id });
    
    // Send approval emails to all applicants (don't wait for them)
    applications.forEach(application => {
      sendProjectApprovalEmail(
        application.userEmail,
        project.name,
        project.description,
        project.startDate,
        project.endDate
      ).catch(err => {
        console.error('Failed to send project approval email:', err);
      });
    });

    res.json({
      success: true,
      message: 'Project approved successfully',
      project
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id/reject
// @desc    Reject a project
// @access  Private (Admin only)
router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.status = 'rejected';
    await project.save();

    res.json({
      success: true,
      message: 'Project rejected successfully',
      project
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project details
// @access  Private
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Regular users can only see approved projects
    if (req.user.role !== 'admin' && project.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete all applications for this project
    await Application.deleteMany({ projectId: project._id });
    
    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;