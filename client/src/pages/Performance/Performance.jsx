import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Award, Clock, ChevronDown, CheckCircle, Save, Send, Users, Plus } from 'lucide-react';
import api from '../../api/axios';
import './Performance.css';

const Performance = () => {
    const [reviews, setReviews] = useState([]);
    const [teamReviews, setTeamReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isManager, setIsManager] = useState(false);

    // Editing State for the active review
    const [activeReviewId, setActiveReviewId] = useState(null);
    const [editData, setEditData] = useState({});

    // Creation State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [newReview, setNewReview] = useState({
        userId: '',
        reviewCycle: 'Q1 2026',
        goals: [
            { title: '', description: '', weightage: 25 },
            { title: '', description: '', weightage: 25 },
            { title: '', description: '', weightage: 25 },
            { title: '', description: '', weightage: 25 }
        ]
    });

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        setUser(currentUser);
        const managerStatus = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(currentUser?.role);
        setIsManager(managerStatus);

        fetchData(managerStatus, currentUser?.id);
    }, []);

    const fetchData = async (managerStatus, currentUserId) => {
        setIsLoading(true);
        try {
            const myRes = await api.get('/performance/me');
            setReviews(myRes.data.data);

            if (managerStatus) {
                const teamRes = await api.get('/performance/team');
                setTeamReviews(teamRes.data.data);

                // Fetch team members list for dropdown
                const usersRes = await api.get('/users');
                const myId = currentUserId || (user ? user.id : null);
                
                // Only show members who report to this manager
                const filteredMembers = usersRes.data.data.filter(u => {
                    const mId = u.managerId?._id || u.managerId;
                    return mId && String(mId) === String(myId);
                });
                setTeamMembers(filteredMembers);
            }
        } catch (error) {
            console.error('Error fetching performance data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/performance', newReview);
            setShowCreateModal(false);
            setNewReview({
                userId: '',
                reviewCycle: 'Q1 2026',
                goals: [
                    { title: '', description: '', weightage: 25 },
                    { title: '', description: '', weightage: 25 },
                    { title: '', description: '', weightage: 25 },
                    { title: '', description: '', weightage: 25 }
                ]
            });
            fetchData();
            alert('Performance Review Created Successfully');
        } catch (err) {
            alert('Failed to create review');
        }
    };

    const handleEditChange = (goalId, field, value) => {
        setEditData(prev => ({
            ...prev,
            [goalId]: {
                ...prev[goalId],
                [field]: value
            }
        }));
    };

    const startEditing = (review) => {
        setActiveReviewId(review._id);
        const initialEdits = {};
        review.goals.forEach(g => {
            initialEdits[g._id] = { selfRating: g.selfRating || '', managerRating: g.managerRating || '' };
        });
        setEditData(initialEdits);
    };

    const submitSelfReview = async (review) => {
        try {
            const updatedGoals = review.goals.map(g => ({
                ...g,
                selfRating: editData[g._id]?.selfRating || g.selfRating
            }));

            await api.put(`/performance/${review._id}`, {
                goals: updatedGoals,
                status: 'SELF_REVIEWED'
            });

            setActiveReviewId(null);
            fetchData();
            alert('Self-Review Submitted Successfully');
        } catch (err) {
            alert('Failed to submit review');
        }
    };

    const submitManagerReview = async (review, feedback, overallRating) => {
        try {
            const updatedGoals = review.goals.map(g => ({
                ...g,
                managerRating: editData[g._id]?.managerRating || g.managerRating
            }));

            await api.put(`/performance/${review._id}`, {
                goals: updatedGoals,
                feedback: feedback,
                overallRating: overallRating,
                status: 'MANAGER_REVIEWED'
            });

            setActiveReviewId(null);
            fetchData();
            alert('Manager Review Submitted Successfully');
        } catch (err) {
            alert('Failed to submit manager review');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DRAFT': return <span className="status-badge bg-warning"><Clock size={14} /> Open for Self-Review</span>;
            case 'SELF_REVIEWED': return <span className="status-badge bg-accent"><TrendingUp size={14} /> Manager Review</span>;
            case 'MANAGER_REVIEWED': return <span className="status-badge bg-success"><CheckCircle size={14} /> Completed</span>;
            default: return null;
        }
    };

    return (
        <motion.div className="performance-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="directory-header mb-6">
                <div>
                    <h1 className="page-title">Performance & Goals</h1>
                    <p className="page-subtitle">Track your quarterly goals, submit self-appraisals, and review feedback.</p>
                </div>
            </div>

            <div className="performance-grid">
                {/* My Goals Column */}
                <div className="performance-column main-col">
                    <h3 className="section-heading mb-4 text-primary font-semibold flex items-center gap-2"><Target size={20} /> My Appraisals</h3>

                    {isLoading ? <p>Loading...</p> : reviews.length === 0 ? (
                        <div className="card text-center p-8">
                            <Award size={48} className="text-gray-300 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-700">No active cycles</h4>
                            <p className="text-gray-500 text-sm">You do not have any active performance reviews.</p>
                        </div>
                    ) : reviews.map(review => (
                        <div key={review._id} className="card mb-6 overflow-hidden">
                            <div className="card-header bg-gray-50 border-b border-gray-100 flex justify-between items-center py-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{review.reviewCycle} Review</h3>
                                    <p className="text-xs text-gray-500 mt-1">Manager: {review.managerId?.firstName} {review.managerId?.lastName}</p>
                                </div>
                                {getStatusBadge(review.status)}
                            </div>

                            <div className="card-body p-0">
                                <table className="goal-table">
                                    <thead>
                                        <tr>
                                            <th>Goal Objective</th>
                                            <th className="text-center">Weight</th>
                                            <th className="text-center">Self Rating (1-5)</th>
                                            <th className="text-center">Mgr Rating (1-5)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {review.goals.map(goal => (
                                            <tr key={goal._id}>
                                                <td>
                                                    <strong className="block text-gray-900 text-sm">{goal.title}</strong>
                                                    <span className="text-xs text-gray-500">{goal.description}</span>
                                                </td>
                                                <td className="text-center font-medium">{goal.weightage}%</td>

                                                <td className="text-center">
                                                    {activeReviewId === review._id && review.status === 'DRAFT' ? (
                                                        <select
                                                            className="rating-select"
                                                            value={editData[goal._id]?.selfRating || ''}
                                                            onChange={(e) => handleEditChange(goal._id, 'selfRating', e.target.value)}
                                                        >
                                                            <option value="">-</option>
                                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className={`rating-orb r-${goal.selfRating || 0}`}>{goal.selfRating || '-'}</span>
                                                    )}
                                                </td>

                                                <td className="text-center">
                                                    <span className={`rating-orb r-${goal.managerRating || 0}`}>{goal.managerRating || '-'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="card-footer bg-white border-t border-gray-100 p-4 flex justify-between items-center">
                                <div>
                                    {review.overallRating && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-700">Final Score:</span>
                                            <span className="text-lg font-bold text-accent">{review.overallRating} / 5</span>
                                        </div>
                                    )}
                                </div>

                                {review.status === 'DRAFT' && activeReviewId !== review._id && (
                                    <button onClick={() => startEditing(review)} className="btn-primary text-sm py-2">
                                        Start Self-Review
                                    </button>
                                )}

                                {review.status === 'DRAFT' && activeReviewId === review._id && (
                                    <button onClick={() => submitSelfReview(review)} className="btn-success text-sm py-2 flex items-center gap-2">
                                        <Send size={16} /> Submit to Manager
                                    </button>
                                )}
                            </div>

                            {review.feedback && (
                                <div className="p-4 bg-blue-50 border-t border-blue-100 m-4 mt-0 rounded-lg">
                                    <strong className="text-sm text-blue-900 block mb-1">Manager Feedback:</strong>
                                    <p className="text-sm text-blue-800 italic">"{review.feedback}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Team Reviews (Managers Only) */}
                {isManager && (
                    <div className="performance-column side-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="section-heading text-primary font-semibold flex items-center gap-2"><Users size={20} /> Team Approvals</h3>
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                            >
                                <Plus size={14} /> Assign Goals
                            </button>
                        </div>

                        {isLoading ? <p>Loading...</p> : teamReviews.length === 0 ? (
                            <div className="card text-center p-6"><p className="text-sm text-gray-500">No pending team reviews.</p></div>
                        ) : (
                            <div className="space-y-4">
                                {teamReviews.map(teamReview => (
                                    <div 
                                        key={teamReview._id} 
                                        className={`card p-4 hover:border-accent transition-colors cursor-pointer ${activeReviewId === teamReview._id ? 'border-accent ring-1 ring-accent' : ''}`}
                                        onClick={() => {
                                            if (teamReview.status === 'SELF_REVIEWED') {
                                                startEditing(teamReview);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{teamReview.userId?.firstName} {teamReview.userId?.lastName}</h4>
                                                <p className="text-xs text-gray-500">{teamReview.userId?.designation}</p>
                                            </div>
                                            {teamReview.status === 'SELF_REVIEWED' ? (
                                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">Action Required</span>
                                            ) : (
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                    teamReview.status === 'MANAGER_REVIEWED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {teamReview.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{teamReview.reviewCycle} Cycle</p>
                                        {teamReview.status === 'SELF_REVIEWED' && (
                                            <button className="text-sm font-medium text-accent flex items-center gap-1 hover:underline">
                                                Review Scores <ChevronDown size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Review Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="modal-overlay">
                        <motion.div 
                            className="modal-container card p-6 max-w-2xl w-full"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Assign Performance Goals</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>

                            <form onSubmit={handleCreateReview} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="label">Select Employee</label>
                                        <select 
                                            required
                                            className="rating-select w-full h-10 px-3"
                                            value={newReview.userId}
                                            onChange={(e) => setNewReview({...newReview, userId: e.target.value})}
                                        >
                                            <option value="">Choose team member...</option>
                                            {teamMembers.map(m => (
                                                <option key={m._id} value={m._id}>
                                                    {m.employeeId} - {m.firstName} {m.lastName} ({m.designation || 'No Designation'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Review Cycle</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="rating-select w-full h-10 px-3"
                                            placeholder="e.g. Q1 2026"
                                            value={newReview.reviewCycle}
                                            onChange={(e) => setNewReview({...newReview, reviewCycle: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="label font-semibold block border-b pb-2">Goal Objectives</label>
                                    {newReview.goals.map((goal, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                                            <div className="col-span-11 grid grid-cols-2 gap-3">
                                                <input 
                                                    required
                                                    type="text" 
                                                    className="w-full text-sm p-2 border rounded" 
                                                    placeholder="Goal Title"
                                                    value={goal.title}
                                                    onChange={(e) => {
                                                        const goals = [...newReview.goals];
                                                        goals[idx].title = e.target.value;
                                                        setNewReview({...newReview, goals});
                                                    }}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-20 text-sm p-2 border rounded" 
                                                        placeholder="Weight %"
                                                        value={goal.weightage}
                                                        onChange={(e) => {
                                                            const goals = [...newReview.goals];
                                                            goals[idx].weightage = parseInt(e.target.value);
                                                            setNewReview({...newReview, goals});
                                                        }}
                                                    />
                                                    <span className="text-xs text-gray-500">% weight</span>
                                                </div>
                                                <textarea 
                                                    className="col-span-2 w-full text-xs p-2 border rounded h-16" 
                                                    placeholder="Description & Success Metrics"
                                                    value={goal.description}
                                                    onChange={(e) => {
                                                        const goals = [...newReview.goals];
                                                        goals[idx].description = e.target.value;
                                                        setNewReview({...newReview, goals});
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center pt-2">
                                                {newReview.goals.length > 1 && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const goals = newReview.goals.filter((_, i) => i !== idx);
                                                            setNewReview({...newReview, goals});
                                                        }}
                                                        className="text-red-400 hover:text-red-600"
                                                    >×</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => setNewReview({...newReview, goals: [...newReview.goals, {title: '', description: '', weightage: 0}]})}
                                        className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Another Goal
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="btn-primary px-6 py-2 text-sm">Assign & Create</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Performance;
