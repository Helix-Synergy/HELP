import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Clock, FileText, CheckCircle, XCircle, AlertCircle, CalendarOff, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../api/axios';
import './Leaves.css';

// Leave categories configuration
const LEAVE_TYPES = [
    { type: 'CASUAL_LEAVE', name: 'Casual Leave', color: 'var(--accent-primary)', defaultTotal: 10 },
    { type: 'SICK_LEAVE', name: 'Sick Leave', color: 'var(--warning)', defaultTotal: 12 },
    { type: 'EARNED_LEAVE', name: 'Earned Leave', color: 'var(--success)', defaultTotal: 15 },
];

const Leaves = () => {
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [balances, setBalances] = useState([]);

    // Auth Check
    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isManager = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);

    const [formData, setFormData] = useState({
        leaveType: 'CASUAL_LEAVE',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const selfRes = await api.get('/leaves/me');
            setLeaveHistory(selfRes.data.data);

            const balanceRes = await api.get('/leaves/balance');
            const rawBalances = balanceRes.data.data.balances;
            
            const formattedBalances = LEAVE_TYPES.map(config => {
                const item = rawBalances.find(b => b.leaveType === config.type);
                const used = item?.used || 0;
                const total = item?.totalAllocated || config.defaultTotal;
                return {
                    ...config,
                    taken: used,
                    available: total - used,
                    total: total
                };
            });
            setBalances(formattedBalances);

            if (isManager) {
                const teamRes = await api.get('/leaves');
                setTeamLeaves(teamRes.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
    };

    const handleSubmitLeave = async () => {
        setIsLoading(true);
        try {
            await api.post('/leaves/apply', formData);
            alert('Leave application submitted successfully!');
            setShowApplyModal(false);
            setFormData({ leaveType: 'CASUAL_LEAVE', startDate: '', endDate: '', reason: '' });
            fetchData(); // Refresh list immediately
        } catch (err) {
            console.error(err);
            alert('Failed to submit leave: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/leaves/${id}/status`, { status });
            alert(`Leave ${status.toLowerCase()} successfully`);
            fetchData(); // Refresh the manager list and own list
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.error || err.message));
        }
    };

    // Helper for status styling
    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED': return <span className="status-badge bg-success"><CheckCircle size={12} /> Approved</span>;
            case 'PENDING': return <span className="status-badge bg-warning"><Clock size={12} /> Pending</span>;
            case 'REJECTED': return <span className="status-badge bg-danger"><XCircle size={12} /> Rejected</span>;
            case 'CANCELLED': return <span className="status-badge bg-secondary"><AlertCircle size={12} /> Cancelled</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const calcDays = (start, end) => {
        if (!start || !end) return 1;
        const diff = new Date(end) - new Date(start);
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <motion.div
            className="leaves-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">View your balances, apply for time off, and track holiday calendars.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowApplyModal(true)}>
                    <Plus size={18} /> Apply for Leave
                </button>
            </div>

            <div className="dashboard-row">
                {/* Balances Section */}
                <div className="card balances-card">
                    <div className="card-header">
                        <h3>Leave Balances</h3>
                    </div>
                    <div className="balances-list">
                        {balances.map((leave, idx) => (
                            <div key={idx} className="balance-item">
                                <div className="balance-info">
                                    <div className="balance-dot" style={{ backgroundColor: leave.color }}></div>
                                    <span className="balance-name">{leave.name}</span>
                                </div>
                                <div className="balance-stats">
                                    <span className="balance-total">{leave.total} <small>Total</small></span>
                                    <span className="balance-divider">|</span>
                                    <span className="balance-avail" style={{ color: 'var(--success)' }}>{leave.available} <small>Available</small></span>
                                    <span className="balance-divider">|</span>
                                    <span className="balance-taken" style={{ color: 'var(--warning)' }}>{leave.taken} <small>Taken</small></span>
                                </div>
                                {/* Visual Progress Bar */}
                                <div className="balance-progress-bg">
                                    <motion.div
                                        className="balance-progress-fill"
                                        style={{ backgroundColor: leave.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(leave.taken / leave.total) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Calendar / Action Card */}
                <div className="card utility-card">
                    <div className="card-header">
                        <h3>Upcoming Organization Holidays</h3>
                    </div>
                    <div className="holiday-list">
                        <div className="holiday-item">
                            <div className="holiday-date">Mar 30</div>
                            <div className="holiday-details">
                                <h4>Good Friday</h4>
                                <p>National Holiday</p>
                            </div>
                        </div>
                        <div className="holiday-item">
                            <div className="holiday-date">May 01</div>
                            <div className="holiday-details">
                                <h4>Labor Day</h4>
                                <p>National Holiday</p>
                            </div>
                        </div>
                    </div>
                    <button className="btn-secondary w-100 mt-4"><CalendarOff size={16} /> View Full Calendar</button>
                </div>
            </div>

            {/* My Leaves */}
            <h3 className="section-title mt-4">My Leave History & Requests</h3>
            <div className="card p-0">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Leave Type</th>
                            <th>Duration</th>
                            <th>Days</th>
                            <th>Status</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveHistory.map(record => (
                            <tr key={record._id}>
                                <td><strong>{record.leaveType.replace('_', ' ')}</strong></td>
                                <td>{formatDate(record.startDate)} - {formatDate(record.endDate)}</td>
                                <td>{calcDays(record.startDate, record.endDate)} {calcDays(record.startDate, record.endDate) === 1 ? 'Day' : 'Days'}</td>
                                <td>{getStatusBadge(record.status)}</td>
                                <td><span className="text-secondary">{record.reason || 'None provided'}</span></td>
                            </tr>
                        ))}
                        {leaveHistory.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-4 text-muted">You have not applied for any leaves yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Team Approvals (Managers Only) */}
            {isManager && (
                <>
                    <h3 className="section-title mt-5">Team Leave Approvals</h3>
                    <div className="card p-0 mb-4">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>Dates</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamLeaves.map(record => (
                                    <tr key={record._id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <strong>{record.user?.firstName} {record.user?.lastName}</strong>
                                            </div>
                                        </td>
                                        <td>{record.leaveType.replace('_', ' ')}</td>
                                        <td>{formatDate(record.startDate)} to {formatDate(record.endDate)}</td>
                                        <td><span className="text-secondary" style={{ maxWidth: '150px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.reason}</span></td>
                                        <td>{getStatusBadge(record.status)}</td>
                                        <td>
                                            {record.status === 'PENDING' ? (
                                                <div className="file-actions" style={{ gap: '8px' }}>
                                                    <button className="icon-btn-small" style={{ color: 'var(--success)' }} title="Approve" onClick={() => handleUpdateStatus(record._id, 'APPROVED')}>
                                                        <Check size={18} />
                                                    </button>
                                                    <button className="icon-btn-small" style={{ color: 'var(--danger)' }} title="Reject" onClick={() => handleUpdateStatus(record._id, 'REJECTED')}>
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: '12px' }}>Actioned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {teamLeaves.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-4 text-muted">No pending leaves for your team.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Leave Application Modal */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="modal-backdrop">
                        <motion.div
                            className="card modal-content"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h2>Apply for Leave</h2>
                                <button className="icon-btn-small" onClick={() => setShowApplyModal(false)}><XCircle size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Leave Type</label>
                                    <select
                                        className="input-field"
                                        value={formData.leaveType}
                                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                    >
                                        <option value="CASUAL_LEAVE">Casual Leave</option>
                                        <option value="SICK_LEAVE">Sick Leave</option>
                                        <option value="EARNED_LEAVE">Earned Leave</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Reason for Leave</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        placeholder="Briefly describe why you are taking leave..."
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowApplyModal(false)} disabled={isLoading}>Cancel</button>
                                <button className="btn-primary" onClick={handleSubmitLeave} disabled={isLoading}>
                                    {isLoading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default Leaves;
