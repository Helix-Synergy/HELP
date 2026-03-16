import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Square, MapPin, Coffee, AlertCircle, FileText } from 'lucide-react';
import api from '../../api/axios';
import './Attendance.css';

const Attendance = () => {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [timePassed, setTimePassed] = useState(0); // in seconds
    const [currentDate, setCurrentDate] = useState(new Date());
    const [recentActivity, setRecentActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load
    useEffect(() => {
        fetchMyAttendance();
    }, []);

    const fetchMyAttendance = async () => {
        try {
            const res = await api.get('/attendance/me');
            const records = res.data.data;
            if (records && records.length > 0) {
                // Determine if currently checked in based on today's record
                const todayRecord = records[0];
                const todayStr = new Date().toDateString();
                const recordStr = new Date(todayRecord.date).toDateString();

                if (todayStr === recordStr) {
                    const lastPunch = todayRecord.punches[todayRecord.punches.length - 1];
                    let initialTimePassed = Math.floor((todayRecord.totalHours || 0) * 3600);

                    if (lastPunch && !lastPunch.punchOut) {
                        setIsCheckedIn(true);
                        // Calculate time passed since the last active punch-in
                        const activeSeconds = Math.floor((new Date() - new Date(lastPunch.punchIn)) / 1000);
                        initialTimePassed += activeSeconds;
                    } else {
                        setIsCheckedIn(false);
                    }

                    // Convert total hours to seconds for display
                    setTimePassed(initialTimePassed);

                    // Parse pulses for activity
                    let activities = [];
                    todayRecord.punches.forEach((p, idx) => {
                        activities.push({
                            id: `in-${idx}`,
                            type: 'Punch In',
                            time: new Date(p.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            status: 'On Time',
                            location: 'Office'
                        });
                        if (p.punchOut) {
                            activities.push({
                                id: `out-${idx}`,
                                type: 'Punch Out',
                                time: new Date(p.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                status: 'Normal',
                                location: 'Office'
                            });
                        }
                    });
                    setRecentActivity(activities.reverse());
                }
            }
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        }
    };

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
            if (isCheckedIn) {
                setTimePassed(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isCheckedIn]);

    const handlePunch = async () => {
        setIsLoading(true);
        try {
            // Get dummy location (in a real app, use navigator.geolocation)
            const payload = {
                location: { lat: 40.7128, lng: -74.0060 },
                ipAddress: '192.168.1.1'
            };
            const res = await api.post('/attendance/punch', payload);

            // Toggle local state instantly
            setIsCheckedIn(!isCheckedIn);

            // Re-fetch to sync display data
            await fetchMyAttendance();
        } catch (err) {
            console.error('Punch failed', err);
            alert('Failed to punch: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            className="attendance-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="attendance-header">
                <div>
                    <h1 className="page-title">Attendance & Time Tracking</h1>
                    <p className="page-subtitle">Manage your daily work hours, breaks, and regularization requests.</p>
                </div>
                <button className="btn-secondary">
                    <FileText size={18} /> Regularize Request
                </button>
            </div>

            <div className="attendance-grid">
                {/* Punch Widget */}
                <div className="card punch-card">
                    <div className="punch-header">
                        <h3>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                        <span className="live-clock">{currentDate.toLocaleTimeString('en-US', { hour12: true })}</span>
                    </div>

                    <div className="punch-body">
                        <div className={`active-timer ${isCheckedIn ? 'running' : 'stopped'}`}>
                            <div className="timer-label">TOTAL HOURS TODAY</div>
                            <div className="timer-value">{formatTime(timePassed)}</div>
                        </div>

                        <motion.button
                            className={`punch-btn ${isCheckedIn ? 'punch-out' : 'punch-in'}`}
                            whileHover={!isLoading ? { scale: 1.05 } : {}}
                            whileTap={!isLoading ? { scale: 0.95 } : {}}
                            onClick={handlePunch}
                            disabled={isLoading}
                        >
                            <div className="punch-btn-inner">
                                {isLoading ? <div className="spinner"></div> : (isCheckedIn ? <Square fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />)}
                            </div>
                            <span>{isCheckedIn ? 'PUNCH OUT' : 'PUNCH IN'}</span>
                        </motion.button>

                        <div className="punch-info">
                            <div className="info-pill"><MapPin size={14} /> New York Office (IP: 192.168.1.1)</div>
                        </div>

                        <div className="quick-actions-row">
                            <button className="btn-icon-text" disabled={!isCheckedIn}><Coffee size={16} /> Start Break</button>
                        </div>
                    </div>
                </div>

                {/* Stats & Activity */}
                <div className="attendance-stats-wrapper">
                    <div className="quick-stats">
                        <div className="card mini-stat">
                            <div className="mini-stat-title">This Week</div>
                            <div className="mini-stat-val text-success">38h 45m</div>
                            <div className="mini-stat-desc">Target: 40h (96%)</div>
                        </div>
                        <div className="card mini-stat">
                            <div className="mini-stat-title">Deficit / Overtimes</div>
                            <div className="mini-stat-val text-warning">+2h 15m</div>
                            <div className="mini-stat-desc">Last 30 days</div>
                        </div>
                    </div>

                    <div className="card activity-card">
                        <div className="card-header">
                            <h3>Today's Activity</h3>
                        </div>
                        <div className="activity-list">
                            {recentActivity.map(act => (
                                <div key={act.id} className="activity-row">
                                    <div className={`activity-icon ${act.type.includes('In') ? 'icon-in' : 'icon-out'}`}>
                                        {act.type.includes('In') ? '↓' : '↑'}
                                    </div>
                                    <div className="activity-details">
                                        <div className="act-type">{act.type}</div>
                                        <div className="act-loc">{act.location}</div>
                                    </div>
                                    <div className="activity-time-status">
                                        <div className="act-time">{act.time}</div>
                                        <div className={`act-badge ${act.status === 'On Time' ? 'bg-success' : 'bg-secondary'}`}>{act.status}</div>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && <p className="text-muted text-center py-4">No activity yet today.</p>}
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};

export default Attendance;
