import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, PlayCircle, CheckCircle, Clock, Award, Filter, X, 
    Plus, Users, RefreshCw, Download, FileText, ExternalLink, Calendar,
    Upload, AlertCircle, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';
import './Learning.css';

const Learning = () => {
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem('hems_user');
        return u ? JSON.parse(u) : null;
    });
    
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);
    
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Tabs logic
    const adminTabs = ['ASSIGNMENTS', 'CATALOG', 'COMPLETIONS'];
    const employeeTabs = ['MY_LEARNING'];
    const [activeTab, setActiveTab] = useState(isAdmin ? 'ASSIGNMENTS' : 'MY_LEARNING');
    
    const [filter, setFilter] = useState('ALL');
    const [activeCourse, setActiveCourse] = useState(null); 
    
    // Assignment Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [assignmentForm, setAssignmentForm] = useState({
        userIds: [],
        dueDate: ''
    });

    // Certificate Upload State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingEnrollment, setUploadingEnrollment] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchData();
        if (isAdmin) {
            fetchEmployees();
            fetchCompletions();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (isAdmin) {
                const res = await api.get('/learning/courses');
                setCourses(res.data.data);
            }
            
            const enrollRes = await api.get('/learning/enrollments/me');
            setEnrollments(enrollRes.data.data);
        } catch (error) {
            console.error('Error fetching learning data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data.data);
        } catch (err) {
            console.error('Failed to fetch employees', err);
        }
    };

    const fetchCompletions = async () => {
        try {
            const res = await api.get('/learning/completions');
            setCompletions(res.data.data);
        } catch (err) {
            console.error('Failed to fetch completions', err);
        }
    };

    const handleSyncUdemy = async () => {
        setIsSyncing(true);
        try {
            const res = await api.post('/learning/sync-udemy');
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Sync failed. Ensure credentials are in .env');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCourse || assignmentForm.userIds.length === 0) return;

        try {
            await api.post('/learning/assign', {
                courseId: selectedCourse._id,
                userIds: assignmentForm.userIds,
                dueDate: assignmentForm.dueDate
            });
            alert('Course assigned successfully!');
            setShowAssignModal(false);
            setAssignmentForm({ userIds: [], dueDate: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to assign');
        }
    };

    const handleCertificateUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !uploadingEnrollment) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await api.post(`/learning/enrollments/${uploadingEnrollment._id}/certificate`, formData);
            alert('Certificate uploaded successfully!');
            setShowUploadModal(false);
            setSelectedFile(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Upload failed');
        } finally {
            setIsUploading(false);
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
                {isAdmin && (
                    <div className="flex gap-3">
                        <button onClick={handleSyncUdemy} disabled={isSyncing} className="btn-secondary flex items-center gap-2">
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Udemy'}
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen size={24} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Enrolled</p>
                        <h3 className="text-2xl font-bold text-gray-900">{enrollments.length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Completed</p>
                        <h3 className="text-2xl font-bold text-gray-900">{enrollments.filter(e => e.status === 'COMPLETED').length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Award size={24} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Certificates</p>
                        <h3 className="text-2xl font-bold text-gray-900">{enrollments.filter(e => e.certificateUrl).length}</h3>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow border border-indigo-400 p-5 flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center"><Clock size={24} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-white/60">Learning Hours</p>
                        <h3 className="text-2xl font-bold">14.5 Hrs</h3>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="flex border-b border-gray-200 px-2 bg-gray-50/50">
                    {isAdmin ? adminTabs.map(tab => (
                        <button
                            key={tab}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    )) : employeeTabs.map(tab => (
                        <button
                            key={tab}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            MY LEARNING PATH
                        </button>
                    ))}
                </div>

                <div className="p-6 bg-gray-50 min-h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-gray-300 border-t-primary animate-spin"></div></div>
                    ) : (
                        <>
                            {/* MY LEARNING / ASSIGNMENTS View */}
                            {(activeTab === 'MY_LEARNING' || (isAdmin && activeTab === 'ASSIGNMENTS')) && (
                                <div className="space-y-4">
                                    {enrollments.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p>No courses found in your learning path.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {enrollments.map(enr => (
                                                <div key={enr._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-hover hover:border-primary flex flex-col">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getCategoryColor(enr.courseId.category)}`}>
                                                            {enr.courseId.category}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {enr.assignmentType === 'ADMIN_ASSIGNED' && (
                                                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                                    <Users size={10} /> ASSIGNED
                                                                </span>
                                                            )}
                                                            {enr.status === 'COMPLETED' ? (
                                                                <span className="text-success flex items-center gap-1 text-xs font-bold"><CheckCircle size={14} /> DONE</span>
                                                            ) : (
                                                                <span className="text-gray-500 text-xs font-medium">{enr.progressPercent}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{enr.courseId.title}</h3>
                                                    
                                                    {enr.dueDate && (
                                                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mb-2">
                                                            <Calendar size={12} /> DUE: {new Date(enr.dueDate).toLocaleDateString()}
                                                        </p>
                                                    )}

                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 mt-2 overflow-hidden">
                                                        <div className={`h-1.5 rounded-full ${enr.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.max(enr.progressPercent, 2)}%` }}></div>
                                                    </div>

                                                    <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={14} /> {enr.courseId.durationMinutes}m</span>
                                                            {enr.courseId.externalProvider === 'UDEMY' && (
                                                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">Udemy</span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex gap-2">
                                                            {enr.status === 'COMPLETED' ? (
                                                                enr.certificateUrl ? (
                                                                    <button 
                                                                        onClick={() => window.open(enr.certificateUrl, '_blank')}
                                                                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                                                                    >
                                                                        <Award size={14} /> View Certificate
                                                                    </button>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => { setUploadingEnrollment(enr); setShowUploadModal(true); }}
                                                                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
                                                                    >
                                                                        <Upload size={14} /> Upload Certificate
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        if (enr.courseId.courseUrl) {
                                                                            window.open(enr.courseId.courseUrl, '_blank');
                                                                            handleUpdateProgress(enr._id, 10); // Mark as in progress
                                                                        } else {
                                                                            setActiveCourse({ ...enr.courseId, enrollmentId: enr._id, currentProgress: enr.progressPercent });
                                                                        }
                                                                    }}
                                                                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
                                                                >
                                                                    <PlayCircle size={14} /> {enr.progressPercent === 0 ? 'Start' : 'Resume'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CATALOG View (Admin Only) */}
                            {isAdmin && activeTab === 'CATALOG' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 flex-1 max-w-md">
                                            <Filter size={18} className="text-gray-400" />
                                            <select
                                                className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none cursor-pointer w-full"
                                                value={filter} onChange={(e) => setFilter(e.target.value)}
                                            >
                                                <option value="ALL">All Categories</option>
                                                <option value="COMPLIANCE">Compliance & Safety</option>
                                                <option value="TECHNICAL">Technical Skills</option>
                                                <option value="LEADERSHIP">Leadership</option>
                                                <option value="SOFT_SKILLS">Soft Skills</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredCourses.map(course => (
                                            <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
                                                <div className="h-32 bg-gray-100 relative">
                                                    {course.thumbnailUrl ? (
                                                        <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center">
                                                            <PlayCircle size={40} className="text-white/50" />
                                                        </div>
                                                    )}
                                                    <span className={`absolute bottom-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow ${getCategoryColor(course.category)}`}>
                                                        {course.category}
                                                    </span>
                                                    {course.externalProvider === 'UDEMY' && (
                                                        <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">UDEMY</span>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{course.description}</p>

                                                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                                            <Clock size={12} /> {course.durationMinutes}m
                                                        </span>
                                                        <button 
                                                            onClick={() => { setSelectedCourse(course); setShowAssignModal(true); }}
                                                            className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={14} /> Assign Course
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* COMPLETIONS View (Admin Only) */}
                            {isAdmin && activeTab === 'COMPLETIONS' && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Course</th>
                                                <th>Completed On</th>
                                                <th>Certificate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completions.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">No completions yet.</td></tr>
                                            ) : (
                                                completions.map(comp => (
                                                    <tr key={comp._id}>
                                                        <td>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900">{comp.userId?.firstName} {comp.userId?.lastName}</span>
                                                                <span className="text-[10px] text-gray-400">{comp.userId?.employeeId}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{comp.courseId?.title}</span>
                                                                <span className="text-[10px] text-gray-400">{comp.courseId?.category}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-xs text-gray-600">
                                                            {new Date(comp.certificateUploadDate || comp.updatedAt).toLocaleDateString()}
                                                        </td>
                                                        <td>
                                                            {comp.certificateUrl ? (
                                                                <button 
                                                                    onClick={() => window.open(comp.certificateUrl, '_blank')}
                                                                    className="text-primary hover:underline text-xs flex items-center gap-1 font-bold"
                                                                >
                                                                    <Download size={14} /> View File
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs italic">Not uploaded</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">Assign Course</h3>
                                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center"><BookOpen size={20} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-primary">Course Selected</p>
                                        <h4 className="text-sm font-bold text-gray-900">{selectedCourse?.title}</h4>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Employees</label>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                                        {employees.filter(e => e.role === 'EMPLOYEE').map(emp => (
                                            <label key={emp._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-primary rounded"
                                                    checked={assignmentForm.userIds.includes(emp._id)}
                                                    onChange={(e) => {
                                                        const ids = e.target.checked 
                                                            ? [...assignmentForm.userIds, emp._id]
                                                            : assignmentForm.userIds.filter(id => id !== emp._id);
                                                        setAssignmentForm({ ...assignmentForm, userIds: ids });
                                                    }}
                                                />
                                                <div>
                                                    <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-[10px] text-gray-400">{emp.designation}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Due Date (Optional)</label>
                                    <input 
                                        type="date" 
                                        className="input-field"
                                        value={assignmentForm.dueDate}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="btn-primary w-full py-3 shadow-lg shadow-primary/20">Assign to {assignmentForm.userIds.length} Employees</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Certificate Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Submit Certificate</h3>
                                <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                                    <Award size={32} />
                                </div>
                                <h4 className="text-lg font-bold mb-1">Congratulations!</h4>
                                <p className="text-xs text-gray-500 mb-6">Please upload your certificate (PDF or Image) to mark this course as officially completed.</p>
                                
                                <label className="block mb-6 cursor-pointer">
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all">
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                                                <FileText size={18} /> {selectedFile.name.substring(0, 20)}...
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Plus size={24} className="text-gray-400" />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select File</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
                                    </div>
                                </label>

                                <button 
                                    onClick={handleCertificateUpload}
                                    disabled={!selectedFile || isUploading}
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                >
                                    {isUploading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    {isUploading ? 'Uploading...' : 'Verify Completion'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Simulated Video Player Modal */}
            <AnimatePresence>
                {activeCourse && (
                    <div className="fixed inset-0 bg-gray-900/95 z-50 flex items-center justify-center p-4 md:p-10">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black w-full max-w-5xl aspect-video rounded-xl shadow-2xl relative flex flex-col overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-center z-10">
                                <h3 className="text-white font-medium">{activeCourse.title}</h3>
                                <button onClick={() => setActiveCourse(null)} className="text-white hover:text-gray-300 p-1"><X size={24} /></button>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative group">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20">
                                        <PlayCircle size={48} className="text-white/80" />
                                    </div>
                                    <p className="text-white/50 text-sm">Course Content Area</p>
                                </div>
                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            handleUpdateProgress(activeCourse.enrollmentId, 100);
                                            setActiveCourse(null);
                                        }}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Mark Complete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default Learning;
