import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Square, MapPin, Coffee, AlertCircle, FileText, Filter, User as UserIcon, Calendar, X, Plus } from 'lucide-react';
import api from '../../api/axios';
import './Attendance.css';

const Attendance = () => {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [timePassed, setTimePassed] = useState(0); // in seconds
    const [currentDate, setCurrentDate] = useState(new Date());
    const [recentActivity, setRecentActivity] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        id: '', userId: '', date: '', punches: [], status: 'PRESENT'
    });

    // Get user from local storage
    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // today YYYY-MM-DD

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Initial load & when filters change
    useEffect(() => {
        if (isAdmin) {
            fetchAllAttendance();
        } else {
            fetchMyAttendance();
        }
    }, [selectedDate, selectedMonth, selectedYear]);

    const fetchAllAttendance = async () => {
        setIsLoading(true);
        try {
            // If a specific date is selected, use date param (shows all employees including absent)
            // Otherwise use month/year params
            let url = '/attendance/all';
            if (selectedDate) {
                url += `?date=${selectedDate}`;
            } else {
                url += `?month=${selectedMonth}&year=${selectedYear}`;
            }
            const res = await api.get(url);
            setAllAttendance(res.data.data);
        } catch (err) {
            console.error('Failed to fetch all attendance', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyAttendance = async () => {
        try {
            const res = await api.get('/attendance/me');
            const records = res.data.data;
            if (records && records.length > 0) {
                // 1. Handle Today's Widget (Timer & Total Hours)
                const todayRecord = records[0];
                const today = new Date();
                const todayStr = today.toDateString();
                const recordStr = new Date(todayRecord.date).toDateString();

                if (todayStr === recordStr) {
                    const lastPunch = todayRecord.punches[todayRecord.punches.length - 1];
                    let initialTimePassed = Math.floor((todayRecord.totalHours || 0) * 3600);

                    if (lastPunch && !lastPunch.punchOut) {
                        setIsCheckedIn(true);
                        
                        // Check for active break
                        const activeBreak = lastPunch.breaks?.find(b => !b.endTime);
                        if (activeBreak) {
                            setIsOnBreak(true);
                        } else {
                            setIsOnBreak(false);
                            const activeSeconds = Math.floor((new Date() - new Date(lastPunch.punchIn)) / 1000);
                            
                            // Subtract all COMPLETED breaks in this session from the active timer
                            let breakSeconds = 0;
                            if (lastPunch.breaks) {
                                lastPunch.breaks.forEach(b => {
                                    if (b.endTime) {
                                        breakSeconds += Math.floor((new Date(b.endTime) - new Date(b.startTime)) / 1000);
                                    }
                                });
                            }
                            initialTimePassed += (activeSeconds - breakSeconds);
                        }
                    } else {
                        setIsCheckedIn(false);
                        setIsOnBreak(false);
                    }
                    setTimePassed(initialTimePassed);
                } else {
                    setIsCheckedIn(false);
                    setIsOnBreak(false);
                    setTimePassed(0);
                }

                // 2. Handle Recent Activity (Session-based)
                let allSessions = [];
                // Process up to 5 recent days
                records.slice(0, 5).forEach(record => {
                    const recordDate = new Date(record.date);
                    const isToday = recordDate.toDateString() === today.toDateString();
                    
                    let dateLabel = "";
                    const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
                    
                    if (isToday) dateLabel = "Today";
                    else if (diffDays === 1) dateLabel = "Yesterday";
                    else dateLabel = recordDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                    record.punches.forEach((p, idx) => {
                        let durationStr = "";
                        if (p.punchOut) {
                            const diffMs = new Date(p.punchOut) - new Date(p.punchIn);
                            const h = Math.floor(diffMs / 3600000);
                            const m = Math.floor((diffMs % 3600000) / 60000);
                            durationStr = `${h}h ${m}m`;
                        } else if (isToday) {
                            durationStr = "Active";
                        }

                        allSessions.push({
                            id: `${record._id}-${idx}`,
                            dateLabel,
                            punchIn: new Date(p.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            punchOut: p.punchOut ? new Date(p.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isToday ? "---" : "No Punch Out"),
                            duration: durationStr,
                            location: p.location?.name || 'Office',
                            status: 'Normal'
                        });
                    });
                });
                
                // Keep newest first
                setRecentActivity(allSessions.reverse());
            }
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        }
    };

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
            if (isCheckedIn && !isOnBreak) {
                setTimePassed(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isCheckedIn, isOnBreak]);

    const handlePunch = async () => {
        setIsLoading(true);

        if (isOnBreak) {
            alert('Please end your break before punching out!');
            setIsLoading(false);
            return;
        }

        const performPunch = async (lat = 40.7128, lng = -74.0060) => {
            try {
                const payload = {
                    location: { lat, lng },
                    ipAddress: '192.168.1.1'
                };
                const res = await api.post('/attendance/punch', payload);
                setIsCheckedIn(!isCheckedIn);
                await fetchMyAttendance();
            } catch (err) {
                console.error('Punch failed', err);
                alert('Failed to punch: ' + (err.response?.data?.error || err.message));
            } finally {
                setIsLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    performPunch(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn("Geolocation failing, falling back to default:", error.message);
                    performPunch(); // fallback
                }
            );
        } else {
            performPunch();
        }
    };

    const handleBreakToggle = async () => {
        setIsLoading(true);
        try {
            await api.post('/attendance/break');
            setIsOnBreak(!isOnBreak);
            await fetchMyAttendance();
        } catch (err) {
            alert('Break action failed: ' + (err.response?.data?.error || err.message));
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
                    <p className="page-subtitle">
                        {isAdmin ? 'Monitor and manage employee attendance records.' : 'Manage your daily work hours, breaks, and regularization requests.'}
                    </p>
                </div>
                {!isAdmin && (
                    <button className="btn-secondary">
                        <FileText size={18} /> Regularize Request
                    </button>
                )}
            </div>

            {/* Admin Filters */}
            {isAdmin && (
                <div className="attendance-filters">
                    <div className="filter-group">
                        <Calendar size={18} className="text-secondary" />
                        <span className="filter-label">Date:</span>
                        <input 
                            type="date"
                            className="filter-select"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Month:</span>
                        <select 
                            className="filter-select"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setSelectedDate(""); // Clear specific date if month is changed
                            }}
                        >
                            <option value="">Select Month</option>
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Year:</span>
                        <select 
                            className="filter-select"
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(e.target.value);
                                setSelectedDate(""); // Clear specific date if year is changed
                            }}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <button className="btn-secondary" onClick={() => isAdmin ? fetchAllAttendance() : fetchMyAttendance()}>
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>
            )}

            <div className={`attendance-grid ${isAdmin ? 'admin-grid' : ''}`}>
                {/* Punch Widget (Hidden for Admin) */}
                {!isAdmin && (
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
                                <button 
                                    className={`btn-icon-text ${isOnBreak ? 'active-break animate-pulse' : ''}`} 
                                    onClick={handleBreakToggle} 
                                    disabled={!isCheckedIn || isLoading}
                                >
                                    <Coffee size={16} /> {isOnBreak ? 'End Break' : 'Start Break'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard / Activity View */}
                {!isAdmin ? (
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
                                <h3>Recent Activity</h3>
                            </div>
                            <div className="activity-list">
                                {recentActivity.map(act => (
                                    <div key={act.id} className="activity-row session-row">
                                        <div className="activity-details">
                                            <div className="act-type">{act.dateLabel}</div>
                                            <div className="act-meta">
                                                <span className="act-loc">{act.location}</span>
                                            </div>
                                        </div>
                                        <div className="activity-times">
                                            <div className="time-group">
                                                <span className="time-label">IN</span>
                                                <span className="time-val">{act.punchIn}</span>
                                            </div>
                                            <div className="time-sep">→</div>
                                            <div className="time-group">
                                                <span className="time-label">OUT</span>
                                                <span className="time-val">{act.punchOut}</span>
                                            </div>
                                        </div>
                                        <div className="activity-duration">
                                            <div className="dur-val">{act.duration}</div>
                                            <div className="dur-label">Duration</div>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && <p className="text-muted text-center py-4">No recent activity.</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Admin Card View */
                    <div className="admin-attendance-section">
                        <h3 className="admin-section-title">Employee Attendance Records</h3>
                        {isLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner"></div>
                                <p className="mt-2">Loading attendance records...</p>
                            </div>
                        ) : allAttendance.length > 0 ? (
                            <div className="attendance-cards-grid">
                                {allAttendance.map(record => (
                                    <motion.div
                                        key={record._id}
                                        className="card attendance-emp-card"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="emp-card-top">
                                            <div className="emp-card-avatar">
                                                <UserIcon size={20} />
                                            </div>
                                            <div className="emp-card-info">
                                                <span className="emp-card-name">{record.user?.firstName} {record.user?.lastName}</span>
                                                <span className="emp-card-id">{record.user?.employeeId}</span>
                                            </div>
                                            <span className={`status-badge status-${record.status?.toLowerCase()}`}>
                                                {record.status}
                                            </span>
                                            {isAdmin && (
                                                <button 
                                                    className="icon-btn-small p-1 hover:bg-gray-100 rounded ml-2"
                                                    onClick={() => {
                                                        const punches = record.punches || [{ punchIn: '', punchOut: '' }];
                                                        setEditData({
                                                            id: record._id,
                                                            userId: record.user?._id || record.user?.id,
                                                            date: record.date,
                                                            status: record.status,
                                                            punches: punches.map(p => ({
                                                                punchIn: p.punchIn ? new Date(p.punchIn).toISOString().slice(0, 16) : '',
                                                                punchOut: p.punchOut ? new Date(p.punchOut).toISOString().slice(0, 16) : ''
                                                            }))
                                                        });
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    <FileText size={14} className="text-accent" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="emp-card-stats">
                                            <div className="emp-card-stat">
                                                <Calendar size={14} />
                                                <span className="stat-label">Date</span>
                                                <span className="stat-value">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="emp-card-stat">
                                                <Clock size={14} />
                                                <span className="stat-label">Hours</span>
                                                <span className="stat-value">{record.totalHours} hrs</span>
                                            </div>
                                            <div className="emp-card-stat" title="Number of times punched in/out today (e.g., before and after breaks)">
                                                <Play size={14} />
                                                <span className="stat-label">Sessions ℹ️</span>
                                                <span className="stat-value">{record.punches?.length || 0}</span>
                                            </div>
                                        </div>
                                        <div className="emp-card-times">
                                            <div className="time-in">
                                                <span className="punch-lbl">IN:</span>
                                                <span className="punch-time">
                                                    {record.punches && record.punches.length > 0 
                                                        ? new Date(record.punches[0].punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                                                        : '--:--'}
                                                </span>
                                            </div>
                                            <div className="time-out">
                                                <span className="punch-lbl">OUT:</span>
                                                <span className="punch-time">
                                                    {record.punches && record.punches.length > 0 
                                                        ? (record.punches[record.punches.length - 1].punchOut 
                                                            ? new Date(record.punches[record.punches.length - 1].punchOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                                            : 'Active')
                                                        : '--:--'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                <p>No records found for the selected period.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Edit Attendance Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Regularize Attendance</h3>
                                <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                        <select 
                                            className="input-field mt-1" 
                                            value={editData.status} 
                                            onChange={(e) => setEditData({...editData, status: e.target.value})}
                                        >
                                            <option value="PRESENT">Present</option>
                                            <option value="HALF_DAY">Half Day</option>
                                            <option value="ABSENT">Absent</option>
                                            <option value="REGULARIZED">Regularized</option>
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Punches</label>
                                        {editData.punches.map((p, idx) => (
                                            <div key={idx} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                                                <div className="form-group">
                                                    <label className="text-[10px] text-gray-400">Punch In</label>
                                                    <input 
                                                        type="datetime-local" 
                                                        className="input-field text-xs py-1" 
                                                        value={p.punchIn} 
                                                        onChange={(e) => {
                                                            const newPunches = [...editData.punches];
                                                            newPunches[idx].punchIn = e.target.value;
                                                            setEditData({...editData, punches: newPunches});
                                                        }}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="text-[10px] text-gray-400">Punch Out</label>
                                                    <input 
                                                        type="datetime-local" 
                                                        className="input-field text-xs py-1" 
                                                        value={p.punchOut} 
                                                        onChange={(e) => {
                                                            const newPunches = [...editData.punches];
                                                            newPunches[idx].punchOut = e.target.value;
                                                            setEditData({...editData, punches: newPunches});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                            className="text-accent text-xs font-bold"
                                            onClick={() => setEditData({
                                                ...editData, 
                                                punches: [...editData.punches, { punchIn: '', punchOut: '' }]
                                            })}
                                        >
                                            + Add Session
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button 
                                    className="btn-primary" 
                                    disabled={isSubmitting}
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        try {
                                            await api.put(`/attendance/${editData.id}`, editData);
                                            alert('Attendance Regularized Successfully');
                                            setShowEditModal(false);
                                            fetchAllAttendance();
                                        } catch (err) {
                                            alert('Error: ' + (err.response?.data?.error || err.message));
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Saving...' : 'Apply Correction'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Attendance;
