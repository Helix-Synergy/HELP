import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users, Plus, ArrowRightLeft } from 'lucide-react';
import './Shifts.css';

const Shifts = () => {
    // Dummy data
    const shifts = [
        { id: 1, name: 'Morning Shift', time: '09:00 AM - 06:00 PM', employees: 145, flexible: false, border: 'var(--accent-primary)' },
        { id: 2, name: 'Evening Shift', time: '02:00 PM - 11:00 PM', employees: 42, flexible: false, border: 'var(--warning)' },
        { id: 3, name: 'Night Shift', time: '10:00 PM - 07:00 AM', employees: 18, flexible: false, border: '#8B5CF6' },
        { id: 4, name: 'Flexible Shift', time: 'Any 9 Hours', employees: 89, flexible: true, border: 'var(--success)' },
    ];

    return (
        <motion.div
            className="shifts-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Shift Management</h1>
                    <p className="page-subtitle">Configure working hours and manage employee shift allocations.</p>
                </div>
                <div className="header-actions-group">
                    <button className="btn-secondary">
                        <ArrowRightLeft size={18} /> Shift Swaps
                    </button>
                    <button className="btn-primary">
                        <Plus size={18} /> New Shift
                    </button>
                </div>
            </div>

            {/* Shift Types Catalog */}
            <h3 className="section-title">Active Shift Configurations</h3>
            <div className="shifts-catalog">
                {shifts.map(shift => (
                    <div key={shift.id} className="card shift-card" style={{ borderTop: `4px solid ${shift.border}` }}>
                        <div className="shift-card-header">
                            <h4 className="shift-name">{shift.name}</h4>
                            {shift.flexible && <span className="status-badge bg-success">Flexible</span>}
                        </div>
                        <div className="shift-detail-row">
                            <Clock size={16} className="text-tertiary" />
                            <span>{shift.time}</span>
                        </div>
                        <div className="shift-detail-row">
                            <Users size={16} className="text-tertiary" />
                            <span>{shift.employees} employees assigned</span>
                        </div>

                        <div className="shift-card-footer">
                            <button className="text-btn">Edit Details</button>
                            <button className="text-btn text-accent">View Roster</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Roster Calendar Placeholder */}
            <h3 className="section-title mt-4">Weekly Roster</h3>
            <div className="card roster-card">
                <div className="roster-header">
                    <div className="roster-nav">
                        <button className="btn-secondary">&lt;</button>
                        <span className="roster-date-range">Mar 02 - Mar 08, 2026</span>
                        <button className="btn-secondary">&gt;</button>
                    </div>
                    <div className="roster-filters">
                        <button className="btn-secondary">Department: All</button>
                    </div>
                </div>

                <div className="roster-grid">
                    <div className="roster-placeholder">
                        <CalendarIcon size={48} className="text-tertiary mb-4" />
                        <p>Advanced drag-and-drop calendar view will be displayed here.</p>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};

export default Shifts;
