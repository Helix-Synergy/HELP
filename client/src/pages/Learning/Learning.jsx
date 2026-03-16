import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlayCircle, CheckCircle, Clock, Award, Filter, X } from 'lucide-react';
import api from '../../api/axios';
import './Learning.css';

const Learning = () => {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('MY_LEARNING'); // MY_LEARNING, CATALOG
    const [filter, setFilter] = useState('ALL');

    const [activeCourse, setActiveCourse] = useState(null); // Used for video player modal

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [coursesRes, enrollmentsRes] = await Promise.all([
                api.get('/learning/courses'),
                api.get('/learning/enrollments/me')
            ]);
            setCourses(coursesRes.data.data);
            setEnrollments(enrollmentsRes.data.data);
        } catch (error) {
            console.error('Error fetching learning data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await api.post('/learning/enrollments', { courseId });
            alert('Successfully enrolled!');
            fetchData(); // Refresh to move it to My Learning
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to enroll');
        }
    };

    const handleUpdateProgress = async (enrollmentId, newPercent) => {
        try {
            await api.put(`/learning/enrollments/${enrollmentId}`, { progressPercent: newPercent });
            fetchData();
        } catch (error) {
            console.error('Failed to update progress');
        }
    };

    const filteredCourses = courses.filter(course => {
        if (filter === 'ALL') return true;
        return course.category === filter;
    });

    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'COMPLIANCE': return 'bg-red-100 text-red-700 border-red-200';
            case 'TECHNICAL': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'LEADERSHIP': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'SOFT_SKILLS': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <motion.div className="learning-page h-[calc(100vh-80px)] overflow-y-auto pb-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="directory-header mb-6">
                <div>
                    <h1 className="page-title">Learning Hub</h1>
                    <p className="page-subtitle">Develop your skills and stay up to date with compliance training.</p>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Enrolled Courses</p>
                        <h3 className="text-2xl font-bold text-gray-900">{enrollments.filter(e => e.status !== 'COMPLETED').length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Completed</p>
                        <h3 className="text-2xl font-bold text-gray-900">{enrollments.filter(e => e.status === 'COMPLETED').length}</h3>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow border border-indigo-400 p-5 flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center"><Award size={24} /></div>
                    <div>
                        <p className="text-sm text-indigo-100 font-medium">Learning Hours</p>
                        <h3 className="text-2xl font-bold">14.5 Hrs</h3>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="flex border-b border-gray-200 px-2 bg-gray-50/50">
                    <button
                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'MY_LEARNING' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
                        onClick={() => setActiveTab('MY_LEARNING')}
                    >
                        My Learning Path
                    </button>
                    <button
                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'CATALOG' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
                        onClick={() => setActiveTab('CATALOG')}
                    >
                        Course Catalog
                    </button>
                </div>

                <div className="p-6 bg-gray-50 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-gray-300 border-t-primary animate-spin"></div></div>
                    ) : (
                        <>
                            {/* MY LEARNING TAB */}
                            {activeTab === 'MY_LEARNING' && (
                                <div className="space-y-4">
                                    {enrollments.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p>You haven't enrolled in any courses yet.</p>
                                            <button onClick={() => setActiveTab('CATALOG')} className="mt-4 text-primary font-medium hover:underline">Browse Catalog</button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {enrollments.map(enr => (
                                                <div key={enr._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-hover hover:border-primary">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getCategoryColor(enr.courseId.category)}`}>
                                                            {enr.courseId.category}
                                                        </span>
                                                        {enr.status === 'COMPLETED' ? (
                                                            <span className="text-success flex items-center gap-1 text-xs font-bold"><CheckCircle size={14} /> COMPLETED</span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs font-medium">{enr.progressPercent}%</span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{enr.courseId.title}</h3>
                                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{enr.courseId.description}</p>

                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                                                        <div className={`h-2 rounded-full ${enr.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.max(enr.progressPercent, 2)}%` }}></div>
                                                    </div>

                                                    <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-3">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={14} /> {enr.courseId.durationMinutes} min</span>
                                                        {enr.status !== 'COMPLETED' ? (
                                                            <button
                                                                onClick={() => setActiveCourse({ ...enr.courseId, enrollmentId: enr._id, currentProgress: enr.progressPercent })}
                                                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
                                                            >
                                                                <PlayCircle size={14} /> {enr.progressPercent === 0 ? 'Start Course' : 'Resume'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs font-medium text-gray-400 border border-gray-200 px-3 py-1.5 rounded-md cursor-not-allowed">Review</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CATALOG TAB */}
                            {activeTab === 'CATALOG' && (
                                <div>
                                    <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-lg border border-gray-200">
                                        <Filter size={18} className="text-gray-400" />
                                        <select
                                            className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none cursor-pointer"
                                            value={filter} onChange={(e) => setFilter(e.target.value)}
                                        >
                                            <option value="ALL">All Categories</option>
                                            <option value="COMPLIANCE">Compliance & Safety</option>
                                            <option value="TECHNICAL">Technical Skills</option>
                                            <option value="LEADERSHIP">Leadership</option>
                                            <option value="SOFT_SKILLS">Soft Skills</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredCourses.map(course => {
                                            const isEnrolled = enrollments.some(e => e.courseId._id === course._id);
                                            return (
                                                <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-md">
                                                    <div className="h-32 bg-gray-100 relative">
                                                        {/* Fake Video Thumbnail Placeholder */}
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center">
                                                            <PlayCircle size={40} className="text-white/50" />
                                                        </div>
                                                        {course.mandatory && (
                                                            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">Required</span>
                                                        )}
                                                        <span className={`absolute bottom-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow ${getCategoryColor(course.category)}`}>
                                                            {course.category}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                                                        <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{course.description}</p>

                                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                                                <Clock size={12} /> {course.durationMinutes}m
                                                            </span>
                                                            {isEnrolled ? (
                                                                <button disabled className="text-xs font-semibold text-gray-400 cursor-not-allowed">Enrolled</button>
                                                            ) : (
                                                                <button onClick={() => handleEnroll(course._id)} className="text-xs font-semibold text-primary hover:text-primary-dark cursor-pointer">Enroll Now</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Video Player Modal (Simulated Learning Experience) */}
            <AnimatePresence>
                {activeCourse && (
                    <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center p-4 md:p-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-black w-full max-w-5xl aspect-video rounded-xl shadow-2xl relative flex flex-col overflow-hidden"
                        >
                            {/* Toolbar */}
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center z-10">
                                <h3 className="text-white font-medium drop-shadow-md">{activeCourse.title}</h3>
                                <button onClick={() => setActiveCourse(null)} className="text-white hover:text-gray-300 p-1 bg-black/50 rounded-full"><X size={20} /></button>
                            </div>

                            {/* Simulated Video Playback Area */}
                            <div className="flex-1 flex items-center justify-center relative group">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                                        <PlayCircle size={48} className="text-white/80" />
                                    </div>
                                    <p className="text-white/50 text-sm">Interactive Video Player Simulation</p>
                                </div>

                                {/* Simulated "Mark Complete" Button -> In reality, a video element `onEnded` event would trigger this */}
                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            handleUpdateProgress(activeCourse.enrollmentId, 100);
                                            setActiveCourse(null);
                                        }}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Finish Lesson
                                    </button>
                                </div>
                                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            handleUpdateProgress(activeCourse.enrollmentId, Math.min(activeCourse.currentProgress + 25, 99));
                                            setActiveCourse(null);
                                        }}
                                        className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-lg text-sm shadow-lg"
                                    >
                                        Save & Exit
                                    </button>
                                </div>
                            </div>

                            {/* Scrubber */}
                            <div className="h-1 bg-gray-800 w-full relative">
                                <div className="absolute top-0 left-0 bottom-0 bg-primary" style={{ width: `${Math.max(activeCourse.currentProgress, 5)}%` }}></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default Learning;
