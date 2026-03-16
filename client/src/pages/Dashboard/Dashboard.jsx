import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Calendar, CheckCircle, TrendingUp, Anchor, Activity, BarChart2, FileText, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const attendanceData = [
    { name: 'Mon', present: 1200, absent: 48 },
    { name: 'Tue', present: 1210, absent: 38 },
    { name: 'Wed', present: 1190, absent: 58 },
    { name: 'Thu', present: 1220, absent: 28 },
    { name: 'Fri', present: 1180, absent: 68 },
];

const teamData = [
    { name: 'Eng', devs: 45 },
    { name: 'Design', devs: 15 },
    { name: 'Product', devs: 12 },
    { name: 'QA', devs: 18 },
];

const pieData = [
    { name: 'Active', value: 85 },
    { name: 'On Leave', value: 10 },
    { name: 'Absent', value: 5 },
];
const COLORS = ['var(--success)', 'var(--warning)', 'var(--danger)'];

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
        <div className="stat-value">{value}</div>
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

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch basic attendance
                const { default: api } = await import('../../api/axios');
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
                    setMyDocuments(docRes.data.data.slice(0, 3)); // Show top 3 recent
                }

                if (payRes && payRes.data && payRes.data.data) {
                    setMyPayslips(payRes.data.data.slice(0, 3)); // top 3 payslips
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-content-layer">
            <div className="page-header">
                <h1>Good Morning, {displayName}</h1>
                <p>Here's what's happening today.</p>
            </div>
            <div className="stats-grid">
                <StatCard title="Today's Hours" value={stats.todayHours} icon={<Clock size={20} />} trend="On track" isPositive={true} />
                <StatCard title="Leave Balance" value={stats.leaveBalance} icon={<Calendar size={20} />} />
                <StatCard title="Upcoming Holiday" value={stats.upcomingHoliday} icon={<Anchor size={20} />} />
                <StatCard title="Announcements" value={stats.announcements} icon={<CheckCircle size={20} />} />
            </div>
            <div className="dashboard-row">
                <div className="card full-height col-span-2">
                    <div className="card-header">
                        <h3>Your Weekly Activity</h3>
                    </div>
                    <div className="card-body" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-primary)' }} cursor={{ fill: 'var(--hover-bg)' }} />
                                <Bar dataKey="present" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="dashboard-row mt-4">
                <div className="card full-height">
                    <div className="card-header">
                        <h3>Recent Payslips</h3>
                        <a href="/payroll" className="btn-link text-small">View All</a>
                    </div>
                    <div className="card-body p-0">
                        <table className="data-table">
                            <tbody>
                                {myPayslips.length > 0 ? myPayslips.map(slip => (
                                    <tr key={slip._id}>
                                        <td>
                                            <div className="file-name-cell flex items-center">
                                                <FileText className="text-secondary mr-2" size={18} />
                                                <span>{new Date(slip.month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })} Payslip</span>
                                            </div>
                                        </td>
                                        <td><span className={`file-badge text-white ${slip.status === 'PAID' ? 'bg-success' : 'bg-warning'}`}>{slip.status}</span></td>
                                        <td>
                                            <button
                                                className="icon-btn-small"
                                                title="Download PDF"
                                                onClick={() => {
                                                    const blob = new Blob([`Payslip Details:\nMonth/Year: ${slip.month}\nBase Salary: $${slip.basicSalary}\nNet Pay: $${slip.netPay}`], { type: 'text/plain' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `Payslip_${slip.month}.txt`;
                                                    a.click();
                                                }}
                                            ><Download size={16} /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4 text-muted">No recent payslips found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card full-height">
                    <div className="card-header">
                        <h3>My Documents</h3>
                        <a href="/documents" className="btn-link text-small">Manage</a>
                    </div>
                    <div className="card-body p-0">
                        <table className="data-table">
                            <tbody>
                                {myDocuments.length > 0 ? myDocuments.map(doc => (
                                    <tr key={doc._id}>
                                        <td>
                                            <div className="file-name-cell">
                                                <FileText className="text-secondary mr-2" size={18} />
                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {doc.title}
                                                </a>
                                            </div>
                                        </td>
                                        <td><span className="text-secondary text-small">{new Date(doc.createdAt).toLocaleDateString()}</span></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="text-center py-4 text-muted">No documents uploaded.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ManagerDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-content-layer">
        <div className="page-header">
            <h1>Manager Overview</h1>
            <p>Monitor your team's performance and pending tasks.</p>
        </div>
        <div className="stats-grid">
            <StatCard title="Team Attendance" value="94%" icon={<Users size={20} />} trend="2%" isPositive={true} />
            <StatCard title="Pending Leaves" value="8" icon={<Clock size={20} />} trend="Requires action" isPositive={false} />
            <StatCard title="Team Leaves Today" value="3" icon={<Calendar size={20} />} />
            <StatCard title="Timesheets Due" value="12" icon={<CheckCircle size={20} />} />
        </div>
        <div className="dashboard-row">
            <div className="card full-height col-span-2">
                <div className="card-header">
                    <h3>Team Capacity</h3>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={attendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="present" stroke="#10B981" fillOpacity={1} fill="url(#colorTeam)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </motion.div>
);

const HRDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-content-layer">
        <div className="page-header">
            <h1>HR Analytics Dashboard</h1>
            <p>Organization-wide workforce metrics.</p>
        </div>
        <div className="stats-grid">
            <StatCard title="Total Headcount" value="1,248" icon={<Users size={20} />} trend="12%" isPositive={true} />
            <StatCard title="New Joiners (MTD)" value="24" icon={<TrendingUp size={20} />} trend="5%" isPositive={true} />
            <StatCard title="Attrition Rate" value="4.2%" icon={<Activity size={20} />} trend="0.5%" isPositive={false} />
            <StatCard title="Open Positions" value="18" icon={<CheckCircle size={20} />} />
        </div>
        <div className="dashboard-row">
            <div className="card full-height">
                <div className="card-header">
                    <h3>Daily Org Attendance</h3>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="card full-height">
                <div className="card-header">
                    <h3>Department Distribution</h3>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={teamData} margin={{ top: 20 }}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="devs" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </motion.div>
);

const SuperAdminDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-content-layer">
        <div className="page-header">
            <h1>System & Super Admin Dashboard</h1>
            <p>Platform health and aggregate reporting.</p>
        </div>
        <div className="stats-grid">
            <StatCard title="Active Tenants/Depts" value="12" icon={<Building size={20} />} trend="2 New" isPositive={true} />
            <StatCard title="API Traffic" value="842K" icon={<Activity size={20} />} trend="14%" isPositive={true} />
            <StatCard title="Storage Used" value="428 GB" icon={<Database size={20} />} trend="Warning" isPositive={false} />
            <StatCard title="System Uptime" value="99.99%" icon={<CheckCircle size={20} />} />
        </div>
        <div className="dashboard-row">
            <div className="card full-height col-span-2">
                <div className="card-header">
                    <h3>Server Load & API Traffic</h3>
                </div>
                <div className="card-body" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={attendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="present" stroke="#F59E0B" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </motion.div>
);

import { Building, Database } from 'lucide-react'; // Late import for Super Admin

const Dashboard = () => {
    // Get real user role from localStorage
    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    let actualRole = 'employee';

    if (user?.role === 'SUPER_ADMIN') actualRole = 'super';
    else if (user?.role === 'HR_ADMIN') actualRole = 'hr';
    else if (user?.role === 'MANAGER') actualRole = 'manager';

    const [activeRole, setActiveRole] = useState(actualRole);

    // Sync state if user changes behind the scenes
    React.useEffect(() => {
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
