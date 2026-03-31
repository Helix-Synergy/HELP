import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Calendar, Clock, AlertCircle, ChevronLeft, 
    CheckCircle, Info, Send, FileText 
} from 'lucide-react';
import api from '../../api/axios';
import './ApplyLeave.css';

const ApplyLeave = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [balances, setBalances] = useState([]);
    const [formData, setFormData] = useState({
        leaveType: 'CASUAL_LEAVE',
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const res = await api.get('/leaves/balance');
            const rawBalances = res.data.data.balances;
            
            const LEAVE_CONFIG = {
                CASUAL_LEAVE: { name: 'Casual Leave', color: '#4f46e5', icon: <Calendar size={20} /> },
                SICK_LEAVE: { name: 'Sick Leave', color: '#f59e0b', icon: <Clock size={20} /> },
                EARNED_LEAVE: { name: 'Earned Leave', color: '#10b981', icon: <FileText size={20} /> },
            };

            const formatted = rawBalances.map(b => ({
                ...b,
                ...LEAVE_CONFIG[b.leaveType],
                available: b.totalAllocated - b.used
            }));
            setBalances(formatted);
        } catch (err) {
            console.error('Failed to fetch balances:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/leaves/apply', formData);
            alert('Leave application submitted successfully!');
            navigate('/leaves');
        } catch (err) {
            alert('Failed to submit leave: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className="apply-leave-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="apply-leave-header">
                <button className="back-btn" onClick={() => navigate('/leaves')}>
                    <ChevronLeft size={20} />
                </button>
                <div className="header-content">
                    <div className="breadcrumbs">Leaves / Apply New</div>
                    <h1 className="page-title">Apply for Leave</h1>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => navigate('/leaves')}>Cancel</button>
                    <button 
                        className="btn-primary flex items-center gap-2" 
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Submitting...' : <><Send size={18} /> Submit Application</>}
                    </button>
                </div>
            </div>

            <div className="apply-leave-grid">
                {/* Left Column: Form */}
                <div className="apply-leave-main">
                    <div className="card section-card">
                        <div className="card-header">
                            <FileText size={20} className="text-accent" />
                            <h3>Application Details</h3>
                        </div>
                        <form id="leaveForm" onSubmit={handleSubmit} className="leave-form">
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select 
                                    className="input-field"
                                    value={formData.leaveType}
                                    onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                    required
                                >
                                    <option value="CASUAL_LEAVE">Casual Leave</option>
                                    <option value="SICK_LEAVE">Sick Leave</option>
                                    <option value="EARNED_LEAVE">Earned Leave</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input 
                                        type="date" 
                                        className="input-field"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input 
                                        type="date" 
                                        className="input-field"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reason for Leave</label>
                                <textarea 
                                    className="input-field" 
                                    rows="4"
                                    placeholder="Please provide a clear reason for your leave request..."
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                        </form>
                    </div>

                    <div className="card info-section">
                        <div className="card-header">
                            <Info size={20} className="text-blue-500" />
                            <h3>Leave Policy Highlights</h3>
                        </div>
                        <ul className="policy-list">
                            <li>Requests should be submitted at least <strong>3 days</strong> in advance for casual/earned leaves.</li>
                            <li>Sick leaves requires medical certificates if exceeding <strong>2 consecutive days</strong>.</li>
                            <li>Leave approval is subject to manager review and team bandwidth.</li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Balances & Stats */}
                <div className="apply-leave-sidebar">
                    <div className="card section-card">
                        <div className="card-header">
                            <CheckCircle size={20} className="text-success" />
                            <h3>Current Balances</h3>
                        </div>
                        <div className="balance-cards">
                            {balances.map((b, idx) => (
                                <div key={idx} className="balance-mini-card" style={{ borderColor: b.color + '33' }}>
                                    <div className="balance-icon" style={{ backgroundColor: b.color + '15', color: b.color }}>
                                        {b.icon}
                                    </div>
                                    <div className="balance-details">
                                        <div className="balance-label">{b.name}</div>
                                        <div className="balance-value">
                                            <span className="available">{b.available}</span>
                                            <span className="total">/ {b.totalAllocated} Days</span>
                                        </div>
                                    </div>
                                    <div className="balance-progress">
                                        <div 
                                            className="progress-bar" 
                                            style={{ 
                                                width: `${(b.available / b.totalAllocated) * 100}%`,
                                                backgroundColor: b.color 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card alert-card bg-amber-50 border-amber-200">
                        <div className="flex gap-3">
                            <AlertCircle className="text-amber-600 shrink-0" size={20} />
                            <div>
                                <h4 className="text-amber-800 font-bold mb-1">Important Note</h4>
                                <p className="text-amber-700 text-xs leading-relaxed">
                                    Submitting a leave request does not guarantee approval. Please coordinate with your lead before finalizing travel plans.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ApplyLeave;
