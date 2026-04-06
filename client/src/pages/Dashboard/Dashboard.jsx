import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Calendar, CheckCircle, Activity, Briefcase, FileText, Download, Building, Database, UserCheck, UserX, AlertTriangle, Play, Square, Megaphone, CalendarCheck, MapPin, Coffee, X, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';
import './Dashboard.css';

// Generic stat card for demonstration
const StatCard = ({ title, value, icon, trend, isPositive, onClick, className = "" }) => (
    <motion.div
        className={`card stat-card ${onClick ? 'interactive' : ''} ${className}`}
        whileHover={onClick ? { y: -4, scale: 1.02, borderColor: 'var(--accent-primary)' } : { y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
    >
        <div className="stat-header">
            <div className="stat-title">{title}</div>
            <div className={`stat-icon-wrapper ${isPositive ? 'positive' : 'neutral'}`}>
                {icon}
            </div>
        </div>
        <div className="stat-value">{value || '0'}</div>
        {trend && (
            <div className={`stat-trend ${isPositive ? 'text-success' : 'text-danger'}`}>
                {isPositive ? '↑' : '↓'} {trend} since last month
            </div>
        )}
    </motion.div>
);

const EmployeeDashboard = () => {
    const [stats, setStats] = useState({
        todayHours: '0.0h',
        monthlyHours: '0.0h',
        leaveBalance: '0 Days',
        upcomingHoliday: 'No Upcoming Holidays',
        upcomingEvent: 'No Upcoming Events',
        announcements: 'No New Announcements'
    });
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [timePassed, setTimePassed] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Detal View State
    const [viewDetail, setViewDetail] = useState(null); // { type: 'ANN'|'EVENT'|'HOLI', data: object }
    const [showViewModal, setShowViewModal] = useState(false);

    // Full Raw Data Store
    const [rawFeed, setRawFeed] = useState({ ann: null, event: null, holi: null });

    const fetchDashboardData = async () => {
        try {
            const userStr = localStorage.getItem('hems_user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user ? user.id : '';

            const [attRes, leaveRes, annRes, eventRes, holiRes] = await Promise.all([
                api.get('/attendance/me'),
                api.get('/leaves/balance'),
                api.get('/announcements').catch(() => ({ data: { data: [] } })),
                api.get('/events').catch(() => ({ data: { data: [] } })),
                api.get('/holidays').catch(() => ({ data: { data: [] } }))
            ]);

            const records = attRes.data.data;
            const todayStr = new Date().toDateString();
            const now = new Date();
            let todayHrs = 0;
            let monthHrs = 0;
            let checkedIn = false;
            let initialTimePassed = 0;

            if (records && records.length > 0) {
                records.forEach(rec => {
                    const recDate = new Date(rec.date);
                    // Monthly calculation
                    if (recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear()) {
                        monthHrs += rec.totalHours || 0;
                    }
                    // Today calculation
                    if (recDate.toDateString() === todayStr) {
                        todayHrs = rec.totalHours || 0;
                        const lastPunch = rec.punches[rec.punches.length - 1];
                        initialTimePassed = Math.floor(todayHrs * 3600);
                        if (lastPunch && !lastPunch.punchOut) {
                            checkedIn = true;
                            
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
                        }
                    }
                });
            }
            setIsCheckedIn(checkedIn);
            setTimePassed(initialTimePassed);

            let cData = [{ name: 'Mon', present: 0 }, { name: 'Tue', present: 0 }, { name: 'Wed', present: 0 }, { name: 'Thu', present: 0 }, { name: 'Fri', present: 0 }];
            if (records && records.length > 0) {
                const daysMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' };
                records.slice(0, 5).forEach(rec => {
                    const recDate = new Date(rec.date);
                    const matchingItem = cData.find(c => c.name === daysMap[recDate.getDay()]);
                    if (matchingItem) matchingItem.present = rec.totalHours || 0;
                });
            }
            setChartData(cData);

            let balance = 0;
            if (leaveRes.data.data && leaveRes.data.data.balances) {
                leaveRes.data.data.balances.forEach(b => {
                    balance += (b.totalAllocated - b.used);
                });
            }

            // Dashboard feeds
            const nextHoli = holiRes.data.data && holiRes.data.data[0] 
                ? `${new Date(holiRes.data.data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${holiRes.data.data[0].name})` 
                : 'No Upcoming Holidays';
            
            const latestAnn = annRes.data.data && annRes.data.data[0]
                ? annRes.data.data[0].title
                : 'No New Announcements';

            const nextEvent = eventRes.data.data && eventRes.data.data[0]
                ? `${eventRes.data.data[0].title}: ${new Date(eventRes.data.data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'No Upcoming Events';

            setStats(prev => ({
                ...prev,
                leaveBalance: `${balance} Days`,
                todayHours: `${todayHrs.toFixed(1)}h`,
                monthlyHours: `${monthHrs.toFixed(1)}h`,
                upcomingHoliday: nextHoli,
                upcomingEvent: nextEvent,
                announcements: latestAnn
            }));

            setRawFeed({
                ann: annRes.data.data?.[0] || null,
                event: eventRes.data.data?.[0] || null,
                holi: holiRes.data.data?.[0] || null
            });

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const clockTimer = setInterval(() => setCurrentDate(new Date()), 1000);
        return () => clearInterval(clockTimer);
    }, []);

    useEffect(() => {
        let interval;
        if (isCheckedIn && !isOnBreak) {
            interval = setInterval(() => setTimePassed(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
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
                await api.post('/attendance/punch', payload);
                setIsCheckedIn(!isCheckedIn);
                await fetchDashboardData();
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
            await fetchDashboardData();
        } catch (err) {
            alert('Break action failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const userStr = localStorage.getItem('hems_user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const name = userData?.firstName || 'Employee';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content-layer">
            <div className="page-header">
                <h1>Welcome Back, {name}</h1>
                <p>Monitor your performance and time tracking center.</p>
            </div>
            
            <div className="stats-grid employee-dashboard-grid">
                {/* Attendance Hub Tile */}
                <div className="card punch-hub-tile">
                    <div className="hub-header">
                        <span className="hub-date">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        <span className="hub-clock">{currentDate.toLocaleTimeString('en-US', { hour12: true })}</span>
                    </div>

                    <div className="hub-body">
                        <div className="hub-timer">
                            <div className="timer-label uppercase text-[10px] font-bold text-secondary">Total Hours Today</div>
                            <div className={`timer-value ${isCheckedIn ? 'active' : ''}`}>{formatTime(timePassed)}</div>
                        </div>

                        <div className="hub-action">
                            <button 
                                className={`circular-punch-btn ${isCheckedIn ? 'punch-out' : 'punch-in'}`}
                                onClick={handlePunch}
                                disabled={isLoading}
                            >
                                <div className="punch-icon">
                                    {isCheckedIn ? <Square fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                                </div>
                                <span className="punch-text">{isCheckedIn ? 'PUNCH OUT' : 'PUNCH IN'}</span>
                                <svg className="progress-ring" width="160" height="160">
                                    <circle className="progress-ring__circle" stroke="currentColor" strokeWidth="6" fill="transparent" r="74" cx="80" cy="80"/>
                                </svg>
                            </button>
                        </div>

                        <div className="hub-footer">
                            <div className="location-pill">
                                <MapPin size={12} /> Office (IP: 192.168.1.1)
                            </div>
                            <button 
                                className={`break-link ${isOnBreak ? 'text-accent-primary animate-pulse' : ''}`} 
                                onClick={handleBreakToggle} 
                                disabled={!isCheckedIn || isLoading}
                            >
                                <Coffee size={14} /> {isOnBreak ? 'End Break' : 'Start Break'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Monthly Hours Tile */}
                <StatCard 
                    title="Monthly Working Hours" 
                    value={stats.monthlyHours} 
                    icon={<Activity size={24} />} 
                    trend="Completed" 
                    isPositive={true} 
                    className="large-stat-card"
                />

                {/* Announcements Tile */}
                <StatCard 
                    title="Announcements" 
                    value={stats.announcements} 
                    icon={<Megaphone size={24} />} 
                    trend="New Alert"
                    isPositive={true}
                    className="large-stat-card"
                    onClick={() => {
                        if (rawFeed.ann) {
                            setViewDetail({ type: 'ANN', data: rawFeed.ann });
                            setShowViewModal(true);
                        }
                    }}
                />

                {/* Leave Balance Tile */}
                <StatCard 
                    title="Leave Balance" 
                    value={stats.leaveBalance} 
                    icon={<Calendar size={24} />} 
                    trend="Available"
                    isPositive={true}
                    className="large-stat-card"
                />

                {/* Upcoming Events Tile */}
                <StatCard 
                    title="Upcoming Events" 
                    value={stats.upcomingEvent} 
                    icon={<CalendarCheck size={24} />} 
                    trend="Next Event"
                    isPositive={true}
                    className="large-stat-card" 
                    onClick={() => {
                        if (rawFeed.event) {
                            setViewDetail({ type: 'EVENT', data: rawFeed.event });
                            setShowViewModal(true);
                        }
                    }}
                />

                {/* Upcoming Holiday Tile */}
                <StatCard 
                    title="Upcoming Holiday" 
                    value={stats.upcomingHoliday} 
                    icon={<Briefcase size={24} />} 
                    trend="Next Break"
                    className="large-stat-card"
                    onClick={() => {
                        if (rawFeed.holi) {
                            setViewDetail({ type: 'HOLI', data: rawFeed.holi });
                            setShowViewModal(true);
                        }
                    }}
                />
            </div>

            {/* View Detail Modal */}
            <AnimatePresence>
                {showViewModal && viewDetail && (
                    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent-light text-accent-primary rounded-lg">
                                        {viewDetail.type === 'ANN' && <Megaphone size={20} />}
                                        {viewDetail.type === 'EVENT' && <CalendarCheck size={20} />}
                                        {viewDetail.type === 'HOLI' && <Briefcase size={20} />}
                                    </div>
                                    <h3 className="font-bold text-lg">
                                        {viewDetail.type === 'ANN' && 'Announcement Details'}
                                        {viewDetail.type === 'EVENT' && 'Event Invitation'}
                                        {viewDetail.type === 'HOLI' && 'Holiday Details'}
                                    </h3>
                                </div>
                                <button onClick={() => setShowViewModal(false)} className="text-tertiary hover:text-primary"><X size={20} /></button>
                            </div>
                            <div className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-primary mb-2">
                                            {viewDetail.data.title || viewDetail.data.name}
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {viewDetail.type === 'ANN' && (
                                                <span className={`status-badge status-${viewDetail.data.priority?.toLowerCase()}`}>
                                                    {viewDetail.data.priority} Priority
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                                                <Calendar size={12} />
                                                {new Date(viewDetail.data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            {viewDetail.data.time && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold">
                                                    <Clock size={12} />
                                                    {viewDetail.data.time}
                                                </span>
                                            )}
                                            {viewDetail.data.location && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                                                    <MapPin size={12} />
                                                    {viewDetail.data.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100 whitespace-pre-wrap">
                                        {viewDetail.data.content || viewDetail.data.description || 'No additional details provided.'}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button className="btn-primary px-8" onClick={() => setShowViewModal(false)}>Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="dashboard-row">
                <div className="card full-height col-span-2">
                    <div className="card-header"><h3>Recent Activity Trend</h3></div>
                    <div className="card-body" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                                <Bar dataKey="present" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        attendancePercentage: 0,
        pendingLeaves: 0,
        leavesToday: 0,
        timesheetsDue: 0,
        activityData: []
    });
    const [loading, setLoading] = useState(true);

    const fetchManagerStats = async () => {
        try {
            const res = await api.get('/dashboard/manager-stats');
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching manager stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagerStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content-layer">
            <div className="page-header">
                <h1>Manager Overview</h1>
                <p>Monitor your team's performance and pending tasks.</p>
            </div>
            <div className="stats-grid">
                <StatCard 
                    title="Team Attendance" 
                    value={`${stats.attendancePercentage}%`} 
                    icon={<Users size={20} />} 
                    isPositive={stats.attendancePercentage >= 90} 
                />
                <StatCard 
                    title="Pending Leaves" 
                    value={String(stats.pendingLeaves)} 
                    icon={<Clock size={20} />} 
                    isPositive={false} 
                />
                <StatCard 
                    title="Team Leaves Today" 
                    value={String(stats.leavesToday)} 
                    icon={<Calendar size={20} />} 
                />
                <StatCard 
                    title="Timesheets Due" 
                    value={String(stats.timesheetsDue)} 
                    icon={<CheckCircle size={20} />} 
                />
            </div>
            <div className="dashboard-row">
                <div className="card full-height col-span-2">
                    <div className="card-header">
                        <h3>Team Capacity Trend</h3>
                    </div>
                    <div className="card-body" style={{ height: '300px' }}>
                        {stats.activityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="present" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTeam)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-secondary italic">
                                No attendance data available for the last 7 days.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


const HRDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content-layer">
        <div className="page-header">
            <h1>HR Analytics Dashboard</h1>
            <p>Organization-wide workforce metrics.</p>
        </div>
        <div className="stats-grid">
            <StatCard title="Total Headcount" value="12" icon={<Users size={20} />} isPositive={true} />
            <StatCard title="Present Today" value="0" icon={<UserCheck size={20} />} />
            <StatCard title="On Leave Today" value="0" icon={<UserX size={20} />} />
            <StatCard title="Pending Actions" value="5" icon={<AlertTriangle size={20} />} />
        </div>
    </motion.div>
);

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: '0',
        presentToday: '0',
        onLeaveToday: '0',
        absentToday: '0',
        pendingItems: '0',
        activityData: []
    });
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modals
    const [showAnnModal, setShowAnnModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showHoliModal, setShowHoliModal] = useState(false);

    // Forms
    const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'MEDIUM' });
    const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', description: '', location: 'Main Office' });
    const [holiForm, setHoliForm] = useState({ name: '', date: '', type: 'NATIONAL', description: '' });

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/system-stats');
            if (res.data.data) {
                setStats({
                    totalEmployees: String(res.data.data.totalEmployees || 0),
                    presentToday: String(res.data.data.presentToday || 0),
                    onLeaveToday: String(res.data.data.onLeaveToday || 0),
                    absentToday: String(res.data.data.absentToday || 0),
                    pendingItems: String(res.data.data.pendingItems || 0),
                    activityData: res.data.data.activityData || []
                });
            }
        } catch (err) {
            console.error("Error fetching admin stats:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/holidays');
            if (res.data.success) {
                setHolidays(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching holidays:", err);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchHolidays();
    }, []);

    const handleCreateAnn = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/announcements', annForm);
            alert('Announcement broadcasted successfully!');
            setShowAnnModal(false);
            setAnnForm({ title: '', content: '', priority: 'MEDIUM' });
        } catch (err) {
            alert('Failed to post announcement: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateEvent = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/events', eventForm);
            alert('Event scheduled successfully!');
            setShowEventModal(false);
            setEventForm({ title: '', date: '', time: '', description: '', location: 'Main Office' });
        } catch (err) {
            alert('Failed to schedule event: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateHoli = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/holidays', holiForm);
            alert('Holiday added successfully!');
            setHoliForm({ name: '', date: '', type: 'NATIONAL', description: '' });
            fetchHolidays();
        } catch (err) {
            alert('Failed to add holiday: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHoli = async (id) => {
        if (!window.confirm('Are you sure you want to remove this holiday?')) return;
        try {
            await api.delete(`/holidays/${id}`);
            fetchHolidays();
        } catch (err) {
            alert('Failed to delete holiday: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) {
        return (
            <div className="dashboard-content-layer flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Activity className="animate-spin text-accent-primary mb-4 mx-auto" size={40} />
                    <p className="text-secondary font-medium">Aggregating Workforce Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content-layer">
            <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1>Workforce Overview</h1>
                    <p>Real-time organization-wide attendance and headcount overview.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary" onClick={() => setShowHoliModal(true)}>
                        <Calendar size={16} /> Manage Holidays
                    </button>
                    <button className="btn-secondary" onClick={() => setShowAnnModal(true)}>
                        <Megaphone size={16} /> Post Announcement
                    </button>
                    <button className="btn-primary" onClick={() => setShowEventModal(true)}>
                        <Plus size={16} /> Schedule Event
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard title="Total Employees" value={stats.totalEmployees} icon={<Users size={20} />} trend="Active" isPositive={true} />
                <StatCard title="Present Today" value={stats.presentToday} icon={<UserCheck size={20} />} trend="Punched In" isPositive={true} />
                <StatCard title="On Leave" value={stats.onLeaveToday} icon={<UserX size={20} />} trend="Approved" isPositive={false} />
                <StatCard title="Pending Actions" value={stats.pendingItems} icon={<Clock size={20} />} trend="Required" isPositive={false} />
            </div>

            <div className="dashboard-row">
                <div className="card full-height col-span-2">
                    <div className="card-header">
                        <h3>Attendance Trend (7 Days)</h3>
                    </div>
                    <div className="card-body" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="present" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Announcement Modal */}
            <AnimatePresence>
                {showAnnModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Broadcast Announcement</h3>
                                <button onClick={() => setShowAnnModal(false)}><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                                        <input 
                                            type="text" 
                                            className="input-field mt-1" 
                                            placeholder="e.g. Office Holiday Notice"
                                            value={annForm.title}
                                            onChange={(e) => setAnnForm({...annForm, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Content</label>
                                        <textarea 
                                            className="input-field mt-1 min-h-[100px]" 
                                            placeholder="Details of the announcement..."
                                            value={annForm.content}
                                            onChange={(e) => setAnnForm({...annForm, content: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                                        <select 
                                            className="input-field mt-1"
                                            value={annForm.priority}
                                            onChange={(e) => setAnnForm({...annForm, priority: e.target.value})}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button className="btn-secondary" onClick={() => setShowAnnModal(false)}>Cancel</button>
                                <button className="btn-primary" disabled={isSubmitting} onClick={handleCreateAnn}>
                                    {isSubmitting ? 'Posting...' : 'Broadcast'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Modal */}
            <AnimatePresence>
                {showEventModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Schedule Company Event</h3>
                                <button onClick={() => setShowEventModal(false)}><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Event Title</label>
                                        <input 
                                            type="text" 
                                            className="input-field mt-1" 
                                            placeholder="e.g. Monthly Townhall"
                                            value={eventForm.title}
                                            onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Event Date</label>
                                            <input 
                                                type="date" 
                                                className="input-field mt-1"
                                                value={eventForm.date}
                                                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Start Time</label>
                                            <input 
                                                type="time" 
                                                className="input-field mt-1"
                                                value={eventForm.time}
                                                onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                                        <input 
                                            type="text" 
                                            className="input-field mt-1" 
                                            placeholder="e.g. Conference Room A / Zoom"
                                            value={eventForm.location}
                                            onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                        <textarea 
                                            className="input-field mt-1 min-h-[80px]" 
                                            placeholder="Event highlights..."
                                            value={eventForm.description}
                                            onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                <button className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                                <button className="btn-primary" disabled={isSubmitting} onClick={handleCreateEvent}>
                                    {isSubmitting ? 'Scheduling...' : 'Confirm Event'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Holiday Modal */}
            <AnimatePresence>
                {showHoliModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Manage Organization Holidays</h3>
                                <button onClick={() => setShowHoliModal(false)}><X size={20} /></button>
                            </div>
                            <div className="p-0 flex flex-col md:flex-row h-[500px]">
                                {/* Left Side: List */}
                                <div className="w-full md:w-1/2 border-r border-gray-100 overflow-y-auto p-6 bg-gray-50/50">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Scheduled Holidays</h4>
                                    <div className="space-y-3">
                                        {holidays.length > 0 ? (
                                            holidays.map((h) => (
                                                <div key={h._id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="overflow-hidden">
                                                        <div className="font-bold text-sm truncate">{h.name}</div>
                                                        <div className="text-[10px] text-tertiary flex items-center gap-1">
                                                            <Calendar size={10} /> {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="p-2 text-danger hover:bg-red-50 rounded-lg transition-colors"
                                                        onClick={() => handleDeleteHoli(h._id)}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-tertiary italic text-sm">No holidays found.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Add Form */}
                                <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 text-accent-primary">Add New Holiday</h4>
                                    <div className="space-y-4">
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Holiday Name</label>
                                            <input 
                                                type="text" 
                                                className="input-field mt-1" 
                                                placeholder="e.g. Independence Day"
                                                value={holiForm.name}
                                                onChange={(e) => setHoliForm({...holiForm, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                                            <input 
                                                type="date" 
                                                className="input-field mt-1"
                                                value={holiForm.date}
                                                onChange={(e) => setHoliForm({...holiForm, date: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                            <select 
                                                className="input-field mt-1"
                                                value={holiForm.type}
                                                onChange={(e) => setHoliForm({...holiForm, type: e.target.value})}
                                            >
                                                <option value="NATIONAL">National Holiday</option>
                                                <option value="REGIONAL">Regional Holiday</option>
                                                <option value="COMPANY">Company Holiday</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                            <textarea 
                                                className="input-field mt-1 min-h-[60px]" 
                                                placeholder="Quick description..."
                                                value={holiForm.description}
                                                onChange={(e) => setHoliForm({...holiForm, description: e.target.value})}
                                            />
                                        </div>
                                        <button 
                                            className="btn-primary w-full py-3" 
                                            disabled={isSubmitting} 
                                            onClick={handleCreateHoli}
                                        >
                                            {isSubmitting ? 'Saving...' : 'Confirm & Add'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Dashboard = () => {
    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    let actualRole = 'employee';

    if (user?.role === 'SUPER_ADMIN') actualRole = 'super';
    else if (user?.role === 'HR_ADMIN') actualRole = 'hr';
    else if (user?.role === 'MANAGER') actualRole = 'manager';

    const [activeRole, setActiveRole] = useState(actualRole);

    useEffect(() => {
        setActiveRole(actualRole);
    }, [actualRole]);

    return (
        <div className="dashboard-page">
            <AnimatePresence mode="wait">
                {activeRole === 'employee' && <EmployeeDashboard key="emp" />}
                {activeRole === 'manager' && <ManagerDashboard key="mgr" />}
                {activeRole === 'hr' && <HRDashboard key="hr" />}
                {activeRole === 'super' && <SuperAdminDashboard key="sup" />}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
