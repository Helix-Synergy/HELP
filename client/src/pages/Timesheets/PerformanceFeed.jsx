import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, FileClock, CheckCircle2, ChevronLeft, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import './Timesheets.css';

const PerformanceFeed = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const [performanceLogs, setPerformanceLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPerformanceFeed(dateParam);
    }, [dateParam]);

    const fetchPerformanceFeed = async (date) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/timesheets?date=${date}`);
            setPerformanceLogs(res.data.data);
        } catch (err) {
            console.error("Failed to fetch feed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className="timesheets-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header mb-6">
                <div className="flex items-center gap-4">
                    <button className="icon-btn-small" onClick={() => navigate('/timesheets')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">Performance Feed</h1>
                        <p className="page-subtitle">Viewing team achievements for {new Date(dateParam).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            <div className="admin-column w-full">
                <div className="card border-none shadow-sm overflow-hidden">
                    <div className="bg-primary p-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold italic tracking-tighter">
                                Daily Submissions
                            </h2>
                            <p className="text-white/60 text-xs">Real-time achievements from the team.</p>
                        </div>
                        <FileClock size={32} className="text-white/20" />
                    </div>
                    
                    <div className="divide-y divide-gray-50 bg-white">
                        {isLoading ? (
                            <div className="p-10 text-center text-secondary">Loading performance logs...</div>
                        ) : performanceLogs.length === 0 ? (
                            <div className="p-10 text-center text-secondary">No submissions found for this day.</div>
                        ) : (
                            performanceLogs.map(log => (
                                <div key={log._id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                        <div className="lg:w-48">
                                            <div className="font-black text-primary leading-tight text-lg">{log.user?.firstName} {log.user?.lastName}</div>
                                            <div className="text-[10px] text-secondary uppercase font-bold tracking-widest mt-1">
                                                {log.user?.email}
                                            </div>
                                            <div className="mt-3 inline-flex items-center gap-1.5 bg-accent/5 text-accent text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
                                                <Clock size={10} /> {log.totalHours} Hours Logged
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="grid grid-cols-1 gap-3">
                                                {log.tasks.map((task, tid) => (
                                                    <div key={tid} className="flex gap-4 p-4 bg-gray-50/30 border border-gray-100 rounded-xl">
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-gray-800">{task.description}</div>
                                                            <div className="text-[10px] text-gray-400 mt-1 uppercase italic tracking-wider">Time Spent: {task.hours}h</div>
                                                        </div>
                                                        <CheckCircle2 size={18} className="text-success self-center" />
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
        </motion.div>
    );
};

export default PerformanceFeed;
