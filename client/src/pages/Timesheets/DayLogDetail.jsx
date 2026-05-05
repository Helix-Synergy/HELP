import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Send, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import './Timesheets.css';

const DayLogDetail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const [tasks, setTasks] = useState([{ id: Date.now(), description: '', hours: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isExisting, setIsExisting] = useState(false);

    // Helper to format date as YYYY-MM-DD without timezone shift
    const formatLocalDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        fetchDayLog(dateParam);
    }, [dateParam]);

    const fetchDayLog = async (date) => {
        setIsFetching(true);
        try {
            const res = await api.get('/timesheets/me');
            // Use standardized local formatting to find the match
            const dayLog = res.data.data.find(log => formatLocalDate(log.date) === date);
            
            if (dayLog) {
                setTasks(dayLog.tasks.map(t => ({
                    id: t._id,
                    description: t.description,
                    hours: t.hours
                })));
                setIsExisting(true);
            } else {
                setTasks([{ id: Date.now(), description: '', hours: '' }]);
                setIsExisting(false);
            }
        } catch (err) {
            console.error("Failed to fetch day log", err);
        } finally {
            setIsFetching(false);
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
                date: dateParam,
                tasks: validTasks.map(t => ({
                    description: t.description,
                    hours: parseFloat(t.hours)
                }))
            };

            await api.post('/timesheets', payload);
            alert("Daily performance log submitted successfully!");
            navigate('/timesheets');
        } catch (err) {
            alert("Submission failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const totalHours = tasks.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

    return (
        <motion.div 
            className="timesheets-page"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="directory-header mb-8">
                <div className="flex items-center gap-4">
                    <button className="icon-btn-small" onClick={() => navigate('/timesheets')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">Work Log Details</h1>
                        <p className="page-subtitle">Managing your performance entry for {new Date(dateParam).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            <div className="main-column w-full max-w-4xl mx-auto">
                {/* Submitted Summary (As requested to be visible first) */}
                {!isFetching && isExisting && tasks.some(t => t.description) && (
                    <motion.div 
                        className="card mb-8 bg-success/5 border-success/20 overflow-hidden shadow-lg"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="bg-success p-4 text-white flex items-center gap-3">
                            <CheckCircle size={20} />
                            <span className="font-black uppercase tracking-widest text-xs italic">Daily Log Submitted & Active</span>
                        </div>
                        <div className="p-8">
                            <h2 className="text-3xl font-black text-primary tracking-tighter mb-4">Achievement Summary</h2>
                            <div className="space-y-4">
                                {tasks.map((task, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-success"></div>
                                            <span className="font-bold text-gray-800">{task.description}</span>
                                        </div>
                                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-black text-primary">{task.hours}h</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                                <div className="text-secondary text-sm font-bold uppercase italic tracking-widest">Total Duration: {totalHours} Hours</div>
                                <p className="text-xs text-gray-400 italic">You can edit the details below if needed.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="card performance-card shadow-xl">
                    <div className="card-header border-b border-gray-50 flex justify-between items-center pb-6 mb-8">

                        <div className="flex items-center gap-3">
                            <Clock className="text-secondary" size={24} />
                            <h2 className="text-xl font-bold">Log Achievements</h2>
                        </div>
                        <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600">
                            {dateParam}
                        </div>
                    </div>

                    {isFetching ? (
                        <div className="p-20 text-center text-secondary">Loading your work log...</div>
                    ) : (
                        <>
                            <div className="tasks-container space-y-6">
                                <AnimatePresence mode='popLayout'>
                                    {tasks.map((task, index) => (
                                        <motion.div 
                                            key={task.id} 
                                            className="task-row p-6 bg-gray-50/50 rounded-2xl border border-gray-50 flex flex-col md:flex-row gap-6"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <div className="flex-[4]">
                                                <label className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2 block">What did you achieve?</label>
                                                <input 
                                                    type="text"
                                                    placeholder="Describe your task or achievement..."
                                                    className="input-field py-3 px-4 font-medium text-base"
                                                    value={task.description}
                                                    onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 md:max-w-[140px]">
                                                <label className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2 block text-center">Hours</label>
                                                <input 
                                                    type="number"
                                                    placeholder="0"
                                                    className="input-field py-3 text-center font-bold text-lg"
                                                    value={task.hours}
                                                    onChange={(e) => updateTask(task.id, 'hours', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-end pb-1">
                                                <button 
                                                    className="p-3 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-xl transition-all"
                                                    onClick={() => removeTask(task.id)}
                                                    title="Remove Line"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center mt-10 pt-8 border-t border-gray-100 gap-6">
                                <button className="text-btn text-accent font-bold flex items-center gap-2 hover:bg-accent/5 px-4 py-2 rounded-xl transition-all" onClick={handleAddTask}>
                                    <Plus size={20} /> Add Another Line
                                </button>
                                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase text-secondary font-bold tracking-widest">Total Daily Hours</div>
                                        <div className="text-3xl font-black text-primary">{totalHours}h</div>
                                    </div>
                                    <button 
                                        className="btn-primary py-4 px-10 rounded-2xl flex items-center gap-3 shadow-xl shadow-accent/20 text-lg font-bold"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                    >
                                        <Send size={20} /> {isLoading ? 'Saving...' : 'Save Log'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default DayLogDetail;
