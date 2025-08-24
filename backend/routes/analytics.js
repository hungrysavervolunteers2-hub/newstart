const express = require('express');
const Project = require('../models/Project');
const Application = require('../models/Application');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Get project statistics
    const totalProjects = await Project.countDocuments();
    const approvedProjects = await Project.countDocuments({ status: 'approved' });
    const pendingProjects = await Project.countDocuments({ status: 'pending' });
    const rejectedProjects = await Project.countDocuments({ status: 'rejected' });

    // Get application statistics
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Get monthly statistics for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          applications: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format monthly stats
    const formattedMonthlyStats = monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      applications: stat.applications
    }));

    res.json({
      success: true,
      data: {
        totalProjects,
        approvedProjects,
        pendingProjects,
        rejectedProjects,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalUsers,
        adminUsers,
        regularUsers,
        monthlyStats: formattedMonthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/projects-by-status
// @desc    Get project counts by status for charts
// @access  Private (Admin only)
router.get('/projects-by-status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const projectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedData = projectsByStatus.map(item => ({
      status: item._id,
      count: item.count
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/applications-by-status
// @desc    Get application counts by status for charts
// @access  Private (Admin only)
router.get('/applications-by-status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const applicationsByStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedData = applicationsByStatus.map(item => ({
      status: item._id,
      count: item.count
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/recent-activity
// @desc    Get recent activity for dashboard
// @access  Private (Admin only)
router.get('/recent-activity', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Get recent projects
    const recentProjects = await Project.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent applications
    const recentApplications = await Application.find()
      .populate('userId', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        recentProjects,
        recentApplications
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;