const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/v1/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res, next) => {
    // If Admin/Manager, see all active projects. If employee, potentially only assigned ones.
    // For simplicity, we return all projects so employees can log against them in the UI.
    const projects = await Project.find({ status: 'ACTIVE' }).select('name projectCode client');
    res.status(200).json({ success: true, count: projects.length, data: projects });
});

// @desc    Create new project
// @route   POST /api/v1/projects
// @access  Private/Admin/Manager
exports.createProject = asyncHandler(async (req, res, next) => {
    // Add manager who created it
    req.body.managerId = req.user.id;
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
});
