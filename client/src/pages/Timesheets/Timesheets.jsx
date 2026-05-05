import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, CheckCircle, Clock, History, Send } from 'lucide-react';
import api from '../../api/axios';
import './Timesheets.css';

const Timesheets = () => {
    const navigate = useNavigate();
    
    // Helper to format date as YYYY-MM-DD without timezone shift
    const formatLocalDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
    const [isAdmin, setIsAdmin] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [loggedDays, setLoggedDays] = useState([]);
    const [userLogs, setUserLogs] = useState([]);
    const [todayLog, setTodayLog] = useState(null);
    const [newLog, setNewLog] = useState({ description: '', hours: '' });

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const adminFlag = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);
        setIsAdmin(adminFlag);
        
        fetchLoggedDays(adminFlag);
        if (!adminFlag) fetchUserHistory();
    }, [viewDate]);

    const fetchLoggedDays = async (adminFlag) => {
        try {
            const res = await api.get(adminFlag ? '/timesheets' : '/timesheets/me');
            const dates = res.data.data.map(log => formatLocalDate(new Date(log.date)));
            setLoggedDays([...new Set(dates)]); // Unique dates

            const todayISO = formatLocalDate(new Date());
            const tLog = res.data.data.find(log => formatLocalDate(new Date(log.date)) === todayISO);
            setTodayLog(tLog);
        } catch (err) {
            console.error("Failed to fetch logged days", err);
        }
    };

    const fetchUserHistory = async () => {
        try {
            const res = await api.get('/timesheets/me');
            setUserLogs(res.data.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        if (isAdmin) {
            navigate(`/timesheets/feed?date=${dateStr}`);
        } else {
            navigate(`/timesheets/day?date=${dateStr}`);
        }
    };

    return (
        <motion.div 
            className="timesheets-page" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="directory-header mb-8">
                <div>
                    <h1 className="page-title text-4xl font-black tracking-tight">Timeline & Performance</h1>
                    <p className="page-subtitle text-lg opacity-80">
                        {isAdmin ? 'Audit team productivity and daily achievements.' : 'Track your achievements and daily milestones.'}
                    </p>
                </div>
            </div>

            {/* Quick Submit Today's Log (For Employees - Visible First) */}
            {!isAdmin && (
                <motion.div 
                    className="card log-achievements-tile mb-8 p-8 border-none shadow-2xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-accent-primary/10 p-3 rounded-2xl">
                                <FileText size={24} className="text-accent-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-primary tracking-tight">Today's Achievement</h3>
                                <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1">Daily Milestone Entry</p>
                            </div>
                        </div>
                        <span className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-black text-secondary">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                        </span>
                    </div>

                    {todayLog ? (
                        <div className="bg-success/5 border border-success/10 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="bg-success/20 p-4 rounded-full">
                                    <CheckCircle size={32} className="text-success" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-primary tracking-tight">Log Successfully Submitted</h4>
                                    <p className="text-sm text-success font-medium italic">"{todayLog.tasks[0]?.description}" + {todayLog.tasks.length - 1} more items</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Logged Duration</p>
                                    <p className="text-3xl font-black text-primary">{todayLog.totalHours}h</p>
                                </div>
                                <button className="btn-secondary px-8 py-3 rounded-2xl" onClick={() => navigate(`/timesheets/day?date=${formatLocalDate(new Date())}`)}>
                                    Update Details
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-accent-light/30 border border-accent-light rounded-3xl p-8">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2 block">What did you achieve today?</label>
                                    <input 
                                        type="text" 
                                        placeholder="Briefly describe your main achievement..." 
                                        className="input-field py-4 text-lg font-medium"
                                        value={newLog.description}
                                        onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-24">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2 block text-center">Hours</label>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            className="input-field py-4 text-center text-xl font-black"
                                            value={newLog.hours}
                                            onChange={(e) => setNewLog({...newLog, hours: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            className="btn-primary py-4 px-10 rounded-2xl shadow-xl shadow-accent-primary/20 flex items-center gap-3 font-bold text-lg"
                                            onClick={async () => {
                                                if (!newLog.description || !newLog.hours) return alert("Please fill details");
                                                try {
                                                    await api.post('/timesheets', {
                                                        date: formatLocalDate(new Date()),
                                                        tasks: [{ description: newLog.description, hours: parseFloat(newLog.hours) }]
                                                    });
                                                    alert("Performance Log Saved!");
                                                    fetchLoggedDays(false);
                                                    fetchUserHistory();
                                                    setNewLog({ description: '', hours: '' });
                                                } catch (err) { alert("Failed to save"); }
                                            }}
                                        >
                                            <Send size={20} /> Submit Achievement
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Calendar Selector Card */}
            <div className="card calendar-selector-card p-10 mb-12">

                <div className="flex items-center justify-between mb-10 px-4">
                    <div className="flex items-center gap-8">
                        <motion.div 
                            className="bg-primary/10 p-5 rounded-3xl"
                            whileHover={{ rotate: 15, scale: 1.1 }}
                        >
                            <CalendarIcon size={32} className="text-primary" />
                        </motion.div>
                        <div>
                            <h3 className="font-black text-4xl text-primary tracking-tighter">
                                {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                                <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Active Tracking Cycle</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="icon-btn-large" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}>
                            <ChevronLeft size={24} />
                        </button>
                        <button className="icon-btn-large" onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className="calendar-grid-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="calendar-day-label">{d}</div>
                    ))}
                </div>
                
                <div className="calendar-grid">
                    {(() => {
                        const days = [];
                        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
                        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
                        const todayStr = formatLocalDate(new Date());

                        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                        
                        for (let d = 1; d <= daysInMonth; d++) {
                            const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                            const dateStr = formatLocalDate(date);
                            const isSelected = selectedDate === dateStr;
                            const isToday = todayStr === dateStr;
                            const isFuture = date > new Date();
                            const hasLogged = loggedDays.includes(dateStr);

                            days.push(
                                <motion.div 
                                    key={d} 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: d * 0.01 }}
                                    whileHover={!isFuture ? { y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" } : {}}
                                    className={`calendar-day large ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
                                    onClick={() => !isFuture && handleDateClick(dateStr)}
                                >
                                    <div className="flex justify-between w-full items-start">
                                        <span className="day-number">{d}</span>
                                        {isToday && <div className="today-dot"></div>}
                                    </div>
                                    <div className={`day-status-indicator ${hasLogged ? 'logged' : ''}`}></div>
                                </motion.div>
                            );
                        }
                        return days;
                    })()}
                </div>
            </div>


            {/* Recent History (Visible to Employees) */}
            {!isAdmin && userLogs.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center gap-3 mb-8">
                        <History size={24} className="text-secondary" />
                        <h3 className="text-2xl font-black text-primary tracking-tight">Recent Performance Activity</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {userLogs.slice(0, 5).map((log, i) => (
                            <motion.div 
                                key={i}
                                className="card p-6 flex justify-between items-center bg-white/50 border-gray-100"
                                whileHover={{ x: 10, backgroundColor: "#fff" }}
                                onClick={() => navigate(`/timesheets/day?date=${formatLocalDate(new Date(log.date))}`)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="bg-gray-100 p-3 rounded-2xl">
                                        <CalendarIcon size={20} className="text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">
                                            {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </p>
                                        <h4 className="font-bold text-gray-800 line-clamp-1">
                                            {log.tasks[0]?.description} {log.tasks.length > 1 && `+ ${log.tasks.length - 1} more`}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Duration</p>
                                        <p className="text-xl font-black text-primary">{log.totalHours}h</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center text-accent">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400 font-medium italic">Showing last 5 entries. Use the calendar above to view older logs.</p>
                    </div>
                </div>
            )}

            {/* Quick Tips */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 tips-grid border-t border-gray-100 pt-12">

                <div className="card p-6 bg-accent/5 border-none">
                    <h4 className="font-bold text-accent mb-2">Detailed View</h4>
                    <p className="text-sm text-gray-600">Click any date to open the full performance feed or daily logger in a dedicated workspace.</p>
                </div>
                <div className="card p-6 bg-success/5 border-none">
                    <h4 className="font-bold text-success mb-2">Real-time Sync</h4>
                    <p className="text-sm text-gray-600">All submissions are instantly visible to managers for review and feedback.</p>
                </div>
                <div className="card p-6 bg-primary/5 border-none">
                    <h4 className="font-bold text-primary mb-2">Historical Access</h4>
                    <p className="text-sm text-gray-600">Navigate back to any previous month to audit or review past performance logs.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default Timesheets;
