import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Calendar, CheckCircle, Activity, Briefcase, FileText, Download, Building, Database, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';
import './Dashboard.css';

// Generic stat card for demonstration
const StatCard = ({ title, value, icon, trend, isPositive }) => (
    <motion.div
        className="card stat-card"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
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
        leaveBalance: '0 Days',
        upcomingHoliday: 'Loading...',
        announcements: '0 New'
    });
    const [chartData, setChartData] = useState([]);
    const [myDocuments, setMyDocuments] = useState([]);
    const [myPayslips, setMyPayslips] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userStr = localStorage.getItem('hems_user');
                const user = userStr ? JSON.parse(userStr) : null;
                const userId = user ? user.id : '';

                const [attRes, leaveRes, docRes, payRes] = await Promise.all([
                    api.get('/attendance/me'),
                    api.get('/leaves/me'),
                    api.get(`/documents/${userId}`).catch(() => ({ data: { data: [] } })),
                    api.get('/payroll/payslips/me').catch(() => ({ data: { data: [] } }))
                ]);

                // Calculate today's hours
                const records = attRes.data.data;
                const todayStr = new Date().toDateString();
                let todayHrs = 0;
                let cData = [
                    { name: 'Mon', present: 0 },
                    { name: 'Tue', present: 0 },
                    { name: 'Wed', present: 0 },
                    { name: 'Thu', present: 0 },
                    { name: 'Fri', present: 0 },
                ];

                if (records && records.length > 0) {
                    const todayRec = records[0];
                    if (new Date(todayRec.date).toDateString() === todayStr) {
                        todayHrs = todayRec.totalHours || 0;
                    }

                    // Populate chart with recent days
                    const daysMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri' };
                    records.slice(0, 5).forEach(rec => {
                        const recDate = new Date(rec.date);
                        const dayChartName = daysMap[recDate.getDay()];
                        const matchingItem = cData.find(c => c.name === dayChartName);
                        if (matchingItem) {
                            matchingItem.present = rec.totalHours || 0;
                        }
                    });
                }
                setChartData(cData);

                // Calculate leave balances
                let balance = 0;
                if (leaveRes.data.data && leaveRes.data.data.balances) {
                    leaveRes.data.data.balances.forEach(b => {
                        balance += b.availableDays;
                    });
                }

                setStats({
                    todayHours: `${todayHrs.toFixed(1)}h`,
                    leaveBalance: `${balance} Days`,
                    upcomingHoliday: 'Mar 30 (Good Friday)',
                    announcements: '1 New'
                });

                if (docRes && docRes.data && docRes.data.data) {
                    setMyDocuments(docRes.data.data.slice(0, 3)); 
                }

                if (payRes && payRes.data && payRes.data.data) {
                    setMyPayslips(payRes.data.data.slice(0, 3));
                }

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            }
        };

        fetchDashboardData();
    }, []);

    const userStr = localStorage.getItem('hems_user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const displayName = userData?.firstName || 'Employee';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content-layer">
            <div className="page-header">
                <h1>Good Morning, {displayName}</h1>
                <p>Here's what's happening today.</p>
            </div>
            <div className="stats-grid">
                <StatCard title="Today's Hours" value={stats.todayHours} icon={<Clock size={20} />} trend="On track" isPositive={true} />
                <StatCard title="Leave Balance" value={stats.leaveBalance} icon={<Calendar size={20} />} />
                <StatCard title="Upcoming Holiday" value={stats.upcomingHoliday} icon={<Briefcase size={20} />} />
                <StatCard title="Announcements" value={stats.announcements} icon={<CheckCircle size={20} />} />
            </div>
            <div className="dashboard-row">
                <div className="card full-height col-span-2">
                    <div className="card-header">
                        <h3>Your Weekly Activity</h3>
                    </div>
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

const ManagerDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content-layer">
        <div className="page-header">
            <h1>Manager Overview</h1>
            <p>Monitor your team's performance and pending tasks.</p>
        </div>
        <div className="stats-grid">
            <StatCard title="Team Attendance" value="94%" icon={<Users size={20} />} trend="2%" isPositive={true} />
            <StatCard title="Pending Leaves" value="8" icon={<Clock size={20} />} isPositive={false} />
            <StatCard title="Team Leaves Today" value="3" icon={<Calendar size={20} />} />
            <StatCard title="Timesheets Due" value="12" icon={<CheckCircle size={20} />} />
        </div>
        <div className="dashboard-row">
            <div className="card full-height col-span-2">
                <div className="card-header">
                    <h3>Team Capacity</h3>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="present" stroke="#10B981" fillOpacity={1} fill="url(#colorTeam)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </motion.div>
);

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchStats();
    }, []);

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
            <div className="page-header">
                <h1>Workforce Overview</h1>
                <p>Real-time organization-wide attendance and headcount overview.</p>
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
