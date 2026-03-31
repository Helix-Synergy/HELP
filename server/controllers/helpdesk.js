const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Ticket = require('../models/Ticket');

// @desc    Get all tickets submitted by the logged in user
// @route   GET /api/v1/helpdesk/me
// @access  Private
exports.getMyTickets = asyncHandler(async (req, res, next) => {
    const tickets = await Ticket.find({ 
        $or: [
            { requesterId: req.user.id },
            { assignedTo: req.user.id }
        ]
    })
        .populate('requesterId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('comments.userId', 'firstName lastName')
        .sort('-createdAt');

    res.status(200).json({ success: true, count: tickets.length, data: tickets });
});

// @desc    Get all organization tickets (Admin / HR view)
// @route   GET /api/v1/helpdesk/all
// @access  Private (Admin/HR)
exports.getAllTickets = asyncHandler(async (req, res, next) => {
    const tickets = await Ticket.find()
        .populate('requesterId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName')
        .sort('-createdAt');

    res.status(200).json({ success: true, count: tickets.length, data: tickets });
});

// @desc    Submit a new support ticket
// @route   POST /api/v1/helpdesk
// @access  Private
exports.createTicket = asyncHandler(async (req, res, next) => {
    req.body.requesterId = req.user.id;

    const ticket = await Ticket.create(req.body);
    res.status(201).json({ success: true, data: ticket });
});

// @desc    Add a comment / update status of ticket
// @route   PUT /api/v1/helpdesk/:id
// @access  Private
exports.updateTicket = asyncHandler(async (req, res, next) => {
    const { status, text, assignedTo } = req.body;

    let ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(new ErrorResponse('Ticket not found', 404));

    // Append comment if there is one
    if (text) {
        ticket.comments.push({
            userId: req.user.id,
            text,
            timestamp: Date.now()
        });
    }

    // Update status if provided
    if (status) {
        ticket.status = status;
    }

    // Update assignment if provided (Admin/HR only usually, but controller allows it)
    if (assignedTo !== undefined) {
        ticket.assignedTo = assignedTo || null;
    }

    await ticket.save();

    ticket = await Ticket.findById(req.params.id)
        .populate('requesterId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('comments.userId', 'firstName lastName');

    res.status(200).json({ success: true, data: ticket });
});
