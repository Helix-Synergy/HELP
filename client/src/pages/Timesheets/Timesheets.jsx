import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Send, Calendar as CalendarIcon, FileClock, Trash2, CheckCircle2, History } from 'lucide-react';
import api from '../../api/axios';
import './Timesheets.css';

const Timesheets = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([{ id: Date.now(), description: '', hours: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [performanceLogs, setPerformanceLogs] = useState([]);
    const [userLogs, setUserLogs] = useState([]);

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const adminFlag = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);
        setIsAdmin(adminFlag);

        fetchInitialData(adminFlag);
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            fetchDayLog(selectedDate);
        }
    }, [selectedDate, isAdmin]);

    const fetchInitialData = async (adminFlag) => {
        try {
            if (adminFlag) {
                fetchPerformanceFeed();
            } else {
                fetchUserHistory();
            }
        } catch (err) {
            console.error("Failed to fetch initial data", err);
        }
    };

    const fetchDayLog = async (date) => {
        try {
            const res = await api.get('/timesheets/me');
            const dayLog = res.data.data.find(log => log.date.split('T')[0] === date);
            
            if (dayLog) {
                setTasks(dayLog.tasks.map(t => ({
                    id: t._id,
                    description: t.description,
                    hours: t.hours
                })));
            } else {
                setTasks([{ id: Date.now(), description: '', hours: '' }]);
            }
        } catch (err) {
            console.error("Failed to fetch day log", err);
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

    const fetchPerformanceFeed = async () => {
        try {
            const res = await api.get('/timesheets');
            setPerformanceLogs(res.data.data);
        } catch (err) {
            console.error("Failed to fetch feed", err);
        }
    };

    const handleAddTask = () => {
        setTasks([...tasks, { id: Date.now(), description: '', hours: '' }]);
    };

    const removeTask = (id) => {
        if (tasks.length === 1) return;
        setTasks(tasks.filter(t => t.id !== id));
    };

    const updateTask = (id, field, value) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleSubmit = async () => {
        const validTasks = tasks.filter(t => t.description && t.hours);
        if (validTasks.length === 0) {
            alert("Please provide at least one complete task with Description and Hours.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                date: selectedDate,
                tasks: validTasks.map(t => ({
                    description: t.description,
                    hours: parseFloat(t.hours)
                }))
            };

            await api.post('/timesheets', payload);
            alert("Daily performance log submitted successfully!");
            fetchUserHistory();
        } catch (err) {
            alert("Submission failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const totalHours = tasks.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

    return (
        <motion.div className="timesheets-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Daily Performance</h1>
                    <p className="page-subtitle">
                        {isAdmin ? 'Monitor real-time team output and results.' : 'Log your daily achievements and track your performance.'}
                    </p>
                </div>
            </div>

            <div className="timesheet-layout">
                {/* Left Side: Daily Logger (Employee Only) */}
                {!isAdmin && (
                    <div className="main-column">
                        <div className="card performance-card">
                            <div className="card-header border-b border-gray-50 flex justify-between items-center pb-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Clock className="text-secondary" size={20} />
                                    <h2 className="font-bold">Log Today's Work</h2>
                                </div>
                                <div className="date-selector-wrapper">
                                    <input 
                                        type="date" 
                                        className="date-input-modern"
                                        value={selectedDate}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="tasks-container space-y-4">
                                <AnimatePresence mode='popLayout'>
                                    {tasks.map((task, index) => (
                                        <motion.div 
                                            key={task.id} 
                                            className="task-row p-4 bg-gray-50/50 rounded-2xl border border-gray-50 flex flex-col md:flex-row gap-4"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <div className="flex-[4]">
                                                <label className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1 block">Task Description</label>
                                                <input 
                                                    type="text"
                                                    placeholder="Describe what you achieved today..."
                                                    className="input-field py-2 font-medium"
                                                    value={task.description}
                                                    onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 md:max-w-[120px]">
                                                <label className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1 block text-center">Hours</label>
                                                <input 
                                                    type="number"
                                                    placeholder="0"
                                                    className="input-field py-2 text-center font-bold"
                                                    value={task.hours}
                                                    onChange={(e) => updateTask(task.id, 'hours', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-end pb-1">
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-danger transition-colors"
                                                    onClick={() => removeTask(task.id)}
                                                    title="Remove Line"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-50">
                                <button className="text-btn text-accent font-bold flex items-center gap-2" onClick={handleAddTask}>
                                    <Plus size={18} /> Add Performance Line
                                </button>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase text-secondary font-bold">Total Daily Hours</div>
                                        <div className="text-xl font-black text-primary">{totalHours}h</div>
                                    </div>
                                    <button 
                                        className="btn-primary py-3 px-8 rounded-2xl flex items-center gap-2 shadow-lg shadow-accent/20"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                    >
                                        <Send size={18} /> {isLoading ? 'Submitting...' : 'Submit Log'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <div className="flex items-center gap-2 mb-6">
                                <History size={20} className="text-secondary" />
                                <h3 className="font-bold text-gray-800">Your Recent Activity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {userLogs.slice(0, 6).map(log => (
                                    <div key={log._id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDate(log.date.split('T')[0])}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="text-xs font-bold text-secondary uppercase italic">
                                                {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="bg-success/10 text-success text-[10px] font-black px-2 py-0.5 rounded-full uppercase italic">Logged</div>
                                        </div>
                                        <div className="text-lg font-black text-primary">{log.totalHours}h</div>
                                        <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{log.tasks.length} {log.tasks.length === 1 ? 'Task' : 'Tasks'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Performance Feed (Admin Only) */}
                {isAdmin && (
                    <div className="admin-column w-full">
                        <div className="card border-none shadow-sm overflow-hidden">
                            <div className="bg-primary p-6 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold italic tracking-tighter">Performance Feed</h2>
                                    <p className="text-white/60 text-xs">Real-time daily achievements from the team.</p>
                                </div>
                                <FileClock size={32} className="text-white/20" />
                            </div>
                            <div className="divide-y divide-gray-50">
                                {performanceLogs.length === 0 ? (
                                    <div className="p-10 text-center text-secondary">No submissions yet today.</div>
                                ) : (
                                    performanceLogs.map(log => (
                                        <div key={log._id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                                <div className="lg:w-48">
                                                    <div className="font-black text-primary leading-tight">{log.user?.firstName} {log.user?.lastName}</div>
                                                    <div className="text-[10px] text-secondary uppercase font-bold tracking-widest mt-1">
                                                        {log.date ? new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                                    </div>
                                                    <div className="mt-3 inline-flex items-center gap-1.5 bg-accent/5 text-accent text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
                                                        <Clock size={10} /> {log.totalHours} Hours
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {log.tasks.map((task, tid) => (
                                                            <div key={tid} className="flex gap-4 p-3 bg-white border border-gray-50 rounded-xl shadow-sm">
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-bold text-gray-800">{task.description}</div>
                                                                    <div className="text-[10px] text-gray-400 mt-1 uppercase italic tracking-wider">Completed in {task.hours}h</div>
                                                                </div>
                                                                <CheckCircle2 size={16} className="text-success self-center" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Timesheets;
