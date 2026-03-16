const express = require('express');
const {
    getMyTickets,
    getAllTickets,
    createTicket,
    updateTicket
} = require('../controllers/helpdesk');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/me', getMyTickets);
router.get('/all', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), getAllTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);

module.exports = router;
