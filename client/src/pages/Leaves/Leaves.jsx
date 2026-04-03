import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [allBalances, setAllBalances] = useState([]);
    const [holidays, setHolidays] = useState([]);

    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isManager = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);
    const isAdmin = user?.role === 'SUPER_ADMIN';
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const holidayRes = await api.get('/leaves/holidays');
            setHolidays(holidayRes.data.data.map(h => new Date(h.date).toISOString().split('T')[0]));

            if (isAdmin) {
                // Admin gets all balances and all requests
                const allBalRes = await api.get('/leaves/all-balances');
                setAllBalances(allBalRes.data.data);
                
                const teamRes = await api.get('/leaves');
                setTeamLeaves(teamRes.data.data);
            } else {
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

                // Managers also need to get team requests
                if (isManager) {
                    const teamRes = await api.get('/leaves');
                    setTeamLeaves(teamRes.data.data);
                }
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
        let count = 0;
        const curDate = new Date(start);
        const lastDate = new Date(end);

        while (curDate <= lastDate) {
            const dayOfWeek = curDate.getDay();
            const dateStr = curDate.toISOString().split('T')[0];

            // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidays.includes(dateStr);

            if (!isWeekend && !isHoliday) {
                count++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
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
                    <p className="page-subtitle">
                        {isAdmin ? 'View employee leave balances and manage approvals.' : 'View your balances, apply for time off, and track holiday calendars.'}
                    </p>
                </div>
                {!isAdmin && (
                    <button className="btn-primary" onClick={() => navigate('/leaves/apply')}>
                        <Plus size={18} /> Apply for Leave
                    </button>
                )}
            </div>

            {isAdmin ? (
                <>
                    <h3 className="section-title mt-4">Employee Leave Balances</h3>
                    <div className="admin-balances-grid">
                        {allBalances.map((item) => (
                            <div key={item.user._id} className="card emp-balance-card">
                                <div className="emp-balance-header">
                                    <div className="emp-info">
                                        <div className="emp-avatar">{item.user.firstName[0]}{item.user.lastName[0]}</div>
                                        <div>
                                            <h4>{item.user.firstName} {item.user.lastName}</h4>
                                            <span className="text-secondary">{item.user.employeeId}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="emp-balance-stats mt-3">
                                    {item.balances.map((b, idx) => (
                                        <div key={idx} className="mini-stat">
                                            <span className="stat-lbl">{b.leaveType.replace('_', ' ')}</span>
                                            <span className="stat-val">
                                                <strong>{b.totalAllocated - b.used}</strong> / {b.totalAllocated}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {allBalances.length === 0 && <p className="text-muted">Loading employee balances...</p>}
                    </div>
                </>
            ) : (
                <>
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
                </>
            )}

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

        </motion.div>
    );
};

export default Leaves;
