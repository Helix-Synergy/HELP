import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, ArrowRight, UserPlus, FileText, Monitor, Check } from 'lucide-react';
import api from '../../api/axios';
import './Onboarding.css';

const Onboarding = () => {
    const [myTasks, setMyTasks] = useState([]);
    const [assignedToMeTasks, setAssignedToMeTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        setUser(currentUser);
        if (currentUser) {
            fetchTasks(currentUser.id);
        }
    }, []);

    const fetchTasks = async (userId) => {
        setIsLoading(true);
        try {
            // Fetch checklist for ME (things I need to do to onboard myself)
            const myRes = await api.get(`/onboarding/${userId}`);
            setMyTasks(myRes.data.data);

            // Fetch things assigned TO ME (e.g. if I am IT, I see "Provision Laptop for John")
            const assignedRes = await api.get('/onboarding/assigned/me');

            // Filter out tasks that I assigned to myself (since they show up in myTasks)
            const othersTasks = assignedRes.data.data.filter(t => t.userId?._id !== userId);
            setAssignedToMeTasks(othersTasks);

        } catch (error) {
            console.error("Error fetching onboarding tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsComplete = async (taskId) => {
        try {
            await api.put(`/onboarding/${taskId}/complete`);
            if (user) fetchTasks(user.id);
        } catch (error) {
            console.error("Error completing task:", error);
            alert("Failed to mark task as complete.");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle size={20} className="text-success" />;
            case 'OVERDUE': return <AlertTriangle size={20} className="text-danger" />;
            case 'IN_PROGRESS': return <Clock size={20} className="text-accent" />;
            default: return <Clock size={20} className="text-warning" />;
        }
    };

    // Derived counts
    const myCompleted = myTasks.filter(t => t.status === 'COMPLETED').length;
    const myProgress = myTasks.length > 0 ? Math.round((myCompleted / myTasks.length) * 100) : 100;

    return (
        <motion.div
            className="onboarding-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header mb-6">
                <div>
                    <h1 className="page-title">Onboarding Center</h1>
                    <p className="page-subtitle">Complete your setup checklist or track requests you are responsible for.</p>
                </div>
            </div>

            <div className="onboarding-grid">

                {/* MY ONBOARDING CHECKLIST */}
                <div className="onboarding-column">
                    <div className="card full-height">
                        <div className="card-header pb-2 border-b-0">
                            <h3>My Setup Checklist</h3>
                            <span className={`file-badge ${myProgress === 100 ? 'bg-success' : 'bg-warning'} text-white`}>
                                {myProgress}% Complete
                            </span>
                        </div>

                        <div className="card-body pt-0">
                            <div className="progress-bar-container mt-2 mb-6">
                                <div className="progress-bar-fill" style={{ width: `${myProgress}%`, backgroundColor: myProgress === 100 ? 'var(--success)' : 'var(--warning-color)' }}></div>
                            </div>

                            {isLoading ? (
                                <p className="text-center text-secondary py-8">Loading your tasks...</p>
                            ) : myTasks.length === 0 ? (
                                <div className="empty-state text-center py-8">
                                    <CheckCircle size={48} className="text-success mx-auto mb-4 opacity-50" />
                                    <h4 className="text-lg font-medium text-primary mb-1">All Caught Up!</h4>
                                    <p className="text-secondary text-sm">You have no pending onboarding tasks.</p>
                                </div>
                            ) : (
                                <div className="task-list">
                                    <AnimatePresence>
                                        {myTasks.map(task => (
                                            <motion.div
                                                key={task._id}
                                                className={`task-card ${task.status === 'COMPLETED' ? 'completed' : ''}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <div className="task-icon-container">
                                                    {task.title.toLowerCase().includes('laptop') ? <Monitor size={20} /> :
                                                        task.title.toLowerCase().includes('policy') ? <FileText size={20} /> :
                                                            <UserPlus size={20} />}
                                                </div>
                                                <div className="task-details">
                                                    <h4>{task.title}</h4>
                                                    <p>{task.description}</p>
                                                    <div className="task-meta">
                                                        <span className={`status-pill ${task.status.toLowerCase()}`}>
                                                            {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                        {task.assignedTo && task.assignedTo._id !== user?.id && task.status !== 'COMPLETED' && (
                                                            <span className="assigned-meta ml-2">⏳ Waiting on: {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="task-actions">
                                                    {task.status !== 'COMPLETED' && task.assignedTo?._id === user?.id ? (
                                                        <button className="icon-btn-success" onClick={() => markAsComplete(task._id)} title="Mark Complete">
                                                            <Check size={18} />
                                                        </button>
                                                    ) : task.status === 'COMPLETED' ? (
                                                        <CheckCircle size={24} className="text-success" />
                                                    ) : null}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* TEAM ACTION CENTER (Tasks assigned to me for others) */}
                <div className="onboarding-column">
                    <div className="card full-height bg-secondary-subtle">
                        <div className="card-header pb-4 border-b border-gray-100">
                            <h3>Action Center</h3>
                            <span className="text-xs text-secondary font-medium uppercase tracking-wider">Assigned to you</span>
                        </div>
                        <div className="card-body">
                            {isLoading ? (
                                <p className="text-center text-secondary py-8">Loading Action Center...</p>
                            ) : assignedToMeTasks.length === 0 ? (
                                <div className="empty-state text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-white flex-center mx-auto mb-4 shadow-sm border border-gray-100">
                                        <Check size={32} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-lg font-medium text-primary mb-1">Inbox Zero</h4>
                                    <p className="text-secondary text-sm">No pending setup tasks for other employees.</p>
                                </div>
                            ) : (
                                <div className="action-center-list space-y-3">
                                    {assignedToMeTasks.map(task => (
                                        <div key={task._id} className="action-card bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 block">
                                                        {task.type === 'OFFBOARDING' ? 'Offboarding' : 'Onboarding'}
                                                    </span>
                                                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                                                </div>
                                                {task.status === 'COMPLETED' ?
                                                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-md">Completed</span> :
                                                    <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-md">Pending</span>
                                                }
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex-center text-xs font-bold">
                                                    {task.userId?.firstName.charAt(0)}{task.userId?.lastName.charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-600">For: <strong>{task.userId?.firstName} {task.userId?.lastName}</strong></span>
                                            </div>

                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>

                                            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                                <span className="text-xs text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                {task.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => markAsComplete(task._id)}
                                                        className="text-xs font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                    >
                                                        Mark Complete <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default Onboarding;
