import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle, Clock, AlertTriangle, ArrowRight, UserPlus, 
    FileText, Monitor, Check, Upload, Eye, X, UserCheck, 
    ChevronRight, Briefcase, Award, PhoneCall
} from 'lucide-react';
import api from '../../api/axios';
import './Onboarding.css';

const Onboarding = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    
    // Employee perspective
    const [myOnboarding, setMyOnboarding] = useState(null);
    const [onboardingStatus, setOnboardingStatus] = useState('NOT_JOINED');
    
    // Admin perspective
    const [onboardingUsers, setOnboardingUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    
    // Modals
    const [showTriggerModal, setShowTriggerModal] = useState(false);
    const [isUploading, setIsUploading] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        setUser(currentUser);
        setIsAdmin(['SUPER_ADMIN', 'HR_ADMIN'].includes(currentUser?.role));
        
        if (currentUser) {
            if (['SUPER_ADMIN', 'HR_ADMIN'].includes(currentUser.role)) {
                fetchAdminData();
            } else {
                fetchEmployeeData();
            }
        }
    }, []);

    const fetchEmployeeData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const res = await api.get('/onboarding/me');
            setMyOnboarding(res.data.data);
            setOnboardingStatus(res.data.onboardingStatus);
            
            // Sync status with localStorage
            const userStr = localStorage.getItem('hems_user');
            if (userStr) {
                const currentUser = JSON.parse(userStr);
                if (currentUser.onboardingStatus !== res.data.onboardingStatus) {
                    currentUser.onboardingStatus = res.data.onboardingStatus;
                    localStorage.setItem('hems_user', JSON.stringify(currentUser));
                    window.dispatchEvent(new Event('userChange')); 
                }
            }
        } catch (error) {
            console.error("Error fetching my onboarding:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAdminData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users');
            // Show everyone except those who haven't even started (NOT_JOINED)
            const inOnboarding = res.data.data.filter(u => u.onboardingStatus !== 'NOT_JOINED');
            setOnboardingUsers(inOnboarding);
        } catch (error) {
            console.error("Error fetching admin onboarding data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (docId, file) => {
        if (!file) return;
        setIsUploading(docId); // Instant feedback
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/onboarding/upload/${docId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchEmployeeData(true); // Silent re-fetch
            setIsUploading(null);
        } catch (error) {
            setIsUploading(null);
            alert('Upload failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            await api.post('/onboarding/submit-form', formData);
            alert('Form submitted successfully');
            fetchEmployeeData();
        } catch (error) {
            alert('Submission failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSubmitDocs = async () => {
        try {
            await api.post('/onboarding/submit-docs');
            alert('Documents submitted for verification');
            fetchEmployeeData();
        } catch (error) {
            alert('Submission failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleActionClick = (userId) => {
        navigate(`/onboarding/details/${userId}`);
    };


    const [eligibleEmployees, setEligibleEmployees] = useState([]);

    const fetchEligibleEmployees = async () => {
        try {
            const res = await api.get('/users');
            // Filter users who are not yet in onboarding or just joined
            const eligible = res.data.data.filter(u => u.onboardingStatus === 'NOT_JOINED' || u.onboardingStatus === 'JOINED');
            setEligibleEmployees(eligible);
        } catch (error) {
            console.error("Error fetching eligible employees:", error);
        }
    };

    useEffect(() => {
        if (showTriggerModal) {
            fetchEligibleEmployees();
        }
    }, [showTriggerModal]);

    const handleTriggerOnboarding = async (userId) => {
        try {
            await api.post(`/onboarding/trigger/${userId}`);
            setShowTriggerModal(false);
            fetchOnboardingPipeline();
            alert('Onboarding triggered successfully!');
        } catch (error) {
            alert('Failed to trigger onboarding: ' + (error.response?.data?.error || error.message));
        }
    };

    // Helper for progress percentage
    const getProgress = (status) => {
        switch(status) {
            case 'DOCUMENTS_PENDING': return 25;
            case 'DOCUMENTS_SUBMITTED': return 40;
            case 'DOCUMENTS_VERIFIED': return 50;
            case 'FORM_PENDING': return 60;
            case 'FORM_SUBMITTED': return 85;
            case 'COMPLETED': return 100;
            default: return 0;
        }
    };

    if (isLoading) return <div className="p-12 text-center">Loading Onboarding...</div>;

    if (isAdmin) {
        return (
            <motion.div className="onboarding-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="directory-header mb-6">
                    <div>
                        <h1 className="page-title">Onboarding Management</h1>
                        <p className="page-subtitle">Track and verify new hire progress.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header border-b border-gray-100 pb-4 mb-4">
                        <h3>Employee Onboarding Pipeline</h3>
                    </div>
                    {onboardingUsers.length === 0 ? (
                        <div className="text-center py-12 text-secondary">No employees currently in onboarding.</div>
                    ) : (
                        <table className="data-table w-full">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Current Phase</th>
                                    <th>Progress</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {onboardingUsers.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div className="font-medium">{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-secondary">{u.email}</div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${u.onboardingStatus.toLowerCase()}`}>
                                                {u.onboardingStatus.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                                                <div className="bg-accent h-2 rounded-full" style={{ width: `${getProgress(u.onboardingStatus)}%` }}></div>
                                            </div>
                                        </td>
                                         <td className="text-right">
                                            {u.onboardingStatus === 'DOCUMENTS_SUBMITTED' && (
                                                <button className="btn-primary py-1 px-3 text-sm" onClick={() => handleActionClick(u._id)}>
                                                    Verify Docs
                                                </button>
                                            )}
                                            {u.onboardingStatus === 'FORM_SUBMITTED' && (
                                                <button className="btn-primary py-1 px-3 text-sm" onClick={() => handleActionClick(u._id)}>
                                                    Verify Form
                                                </button>
                                            )}
                                            {u.onboardingStatus === 'COMPLETED' && (
                                                <button className="btn-secondary py-1 px-3 text-sm flex items-center gap-1 ml-auto" onClick={() => handleActionClick(u._id)}>
                                                    <Eye size={14} /> View Details
                                                </button>
                                            )}
                                            {u.onboardingStatus === 'DOCUMENTS_VERIFIED' && (
                                                <button className="text-accent hover:underline text-xs font-semibold" onClick={() => handleActionClick(u._id)}>
                                                    View Progress
                                                </button>
                                            )}
                                            {['DOCUMENTS_PENDING', 'FORM_PENDING'].includes(u.onboardingStatus) && (
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="text-xs text-secondary italic">Step {u.onboardingStatus.startsWith('DOC') ? '1' : '2'} in progress</span>
                                                    <button className="text-accent hover:underline text-xs font-semibold" onClick={() => handleActionClick(u._id)}>Details</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Trigger Selection Modal */}
                {showTriggerModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Select Employee to Onboard</h3>
                                <button onClick={() => setShowTriggerModal(false)}><X /></button>
                            </div>
                            <div className="overflow-y-auto flex-1 pr-2">
                                {eligibleEmployees.length > 0 ? (
                                    <div className="space-y-2">
                                        {eligibleEmployees.map(emp => (
                                            <div key={emp._id} className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center group">
                                                <div>
                                                    <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
                                                    <div className="text-xs text-secondary">{emp.email}</div>
                                                </div>
                                                <button 
                                                    className="bg-accent/10 text-accent px-3 py-1 rounded-md text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleTriggerOnboarding(emp._id)}
                                                >
                                                    Trigger
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-secondary">
                                        No new employees found ready for onboarding.
                                    </div>
                                )}
                            </div>
                            <button 
                                className="w-full mt-4 btn-secondary"
                                onClick={() => setShowTriggerModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        );
    }

    // Employee Perspective
    const progress = getProgress(onboardingStatus);
    
    return (
        <motion.div className="onboarding-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="directory-header mb-8">
                <div>
                    <h1 className="page-title">Welcome to the Team!</h1>
                    <p className="page-subtitle">
                        {onboardingStatus === 'COMPLETED' ? "You've successfully joined the team." : "Please complete your onboarding process to access all features."}
                    </p>
                </div>
            </div>

            <div className="onboarding-progress-card card mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-primary">Your Onboarding journey</span>
                    <span className="text-accent font-bold">{progress}% Complete</span>
                </div>
                <div className="progress-bar-container h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        className="progress-bar-fill h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                    ></motion.div>
                </div>
                <div className="grid grid-cols-4 mt-4 text-[10px] uppercase tracking-wider font-bold text-secondary">
                    <div className={onboardingStatus !== 'NOT_JOINED' ? 'text-accent' : ''}>JOINED</div>
                    <div className={['DOCUMENTS_SUBMITTED', 'DOCUMENTS_VERIFIED', 'FORM_PENDING', 'FORM_SUBMITTED', 'COMPLETED'].includes(onboardingStatus) ? 'text-accent' : ''}>DOCUMENTS</div>
                    <div className={['FORM_SUBMITTED', 'COMPLETED'].includes(onboardingStatus) ? 'text-accent' : ''}>DETAILS</div>
                    <div className={onboardingStatus === 'COMPLETED' ? 'text-accent' : ''}>FINISH</div>
                </div>
            </div>

            <div className="onboarding-content">
                {onboardingStatus === 'DOCUMENTS_PENDING' && (
                    <div className="card p-8 text-center max-w-2xl mx-auto">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex-center mx-auto mb-6">
                            <FileText size={40} className="text-accent" />
                        </div>
                        <h2 className="mb-2">Phase 1: Documents</h2>
                        <p className="text-secondary mb-8">Please upload all mandatory documents to proceed.</p>
                        
                        <div className="space-y-4 text-left">
                            {myOnboarding?.documents.map(doc => (
                                <div key={doc._id} className="document-upload-row p-4 border rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-50 rounded-lg relative">
                                            {doc.status === 'APPROVED' ? <CheckCircle className="text-success" /> : <FileText className="text-secondary" />}
                                            {doc.required && doc.status === 'PENDING' && (
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {doc.name}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${doc.required ? 'bg-danger/10 text-danger' : 'bg-gray-100 text-secondary'}`}>
                                                    {doc.required ? 'Required' : 'Optional'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-secondary">Status: <strong className={doc.status === 'APPROVED' ? 'text-success' : 'text-accent'}>{doc.status}</strong></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isUploading === doc._id ? (
                                            <div className="flex items-center gap-2 text-accent font-bold animate-pulse">
                                                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                                Uploading...
                                            </div>
                                        ) : doc.status !== 'APPROVED' && (
                                            <label className="btn-secondary py-1 px-4 text-sm cursor-pointer hover:bg-gray-100">
                                                <Upload size={14} className="mr-2 inline" /> {doc.fileUrl ? 'Change' : 'Upload'}
                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(doc._id, e.target.files[0])} />
                                            </label>
                                        )}
                                        {doc.fileUrl && !isUploading && (
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-50 rounded-lg"><Eye size={18} /></a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-6 border-t flex flex-col items-center">
                            <button 
                                className="btn-primary px-12 py-3 shadow-lg shadow-accent/20 flex items-center gap-2"
                                onClick={handleSubmitDocs}
                                disabled={myOnboarding?.documents.some(d => d.required && d.status === 'PENDING')}
                            >
                                Submit for Verification <ArrowRight size={18} />
                            </button>
                            {myOnboarding?.documents.some(d => d.required && d.status === 'PENDING') && (
                                <p className="text-xs text-danger mt-3 font-medium">Please upload all required documents to enable submission.</p>
                            )}
                        </div>
                    </div>
                )}

                {onboardingStatus === 'DOCUMENTS_SUBMITTED' && (
                    <div className="card p-12 text-center max-w-xl mx-auto">
                        <Clock size={64} className="text-warning mx-auto mb-6 opacity-50" />
                        <h2>Documents Under Review</h2>
                        <p className="text-secondary">Our HR team is currently verifying your documents. You'll be notified once approved to proceed to the next step.</p>
                    </div>
                )}

                {onboardingStatus === 'FORM_PENDING' && (
                    <div className="card p-8 max-w-3xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-green-50 rounded-2xl">
                                <UserCheck size={32} className="text-success" />
                            </div>
                            <div>
                                <h2 className="mb-0">Phase 2: Detailed Information</h2>
                                <p className="text-secondary text-sm">Fill in your personal and bank details to complete your profile.</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = {
                                fathersName: formData.get('fathersName'),
                                bloodGroup: formData.get('bloodGroup'),
                                dateOfBirth: formData.get('dob'),
                                address: formData.get('address'),
                                qualification: formData.get('qualification'),
                                experienceYears: formData.get('experienceYears'),
                                aadharNumber: formData.get('aadhar'),
                                panNumber: formData.get('pan'),
                                pfNumber: formData.get('pfNumber'),
                                ctc: formData.get('ctc'),
                                bankDetails: {
                                    accountHolderName: formData.get('accName'),
                                    accountNumber: formData.get('accNum'),
                                    bankName: formData.get('bankName'),
                                    ifscCode: formData.get('ifsc')
                                },
                                emergencyContact: {
                                    name: formData.get('emergencyName'),
                                    relationship: formData.get('emergencyRel'),
                                    phone: formData.get('emergencyPhone')
                                },
                                insuranceDetails: {
                                    policyType: formData.get('insuranceType'),
                                    policyNumber: formData.get('policyNumber')
                                }
                            };
                            handleFormSubmit(data);
                        }} className="space-y-10">
                            {/* Personal Information */}
                            <section>
                                <h3 className="section-title text-sm uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">1</div>
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group"><label>Father's Name</label><input name="fathersName" required className="input-field" placeholder="Full Name" /></div>
                                    <div className="form-group"><label>Date of Birth</label><input name="dob" type="date" required className="input-field" /></div>
                                    <div className="form-group"><label>Blood Group</label>
                                        <select name="bloodGroup" required className="input-field">
                                            <option value="">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Aadhar Number</label><input name="aadhar" required className="input-field" placeholder="12-digit number" /></div>
                                    <div className="form-group"><label>PAN Number</label><input name="pan" required className="input-field" placeholder="ABCDE1234F" /></div>
                                    <div className="form-group col-span-2"><label>Current Address</label><textarea name="address" required className="input-field h-20" placeholder="Full mailing address"></textarea></div>
                                </div>
                            </section>

                            {/* Professional & Identification */}
                            <section>
                                <h3 className="section-title text-sm uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">2</div>
                                    Professional & Identification
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group"><label>Highest Qualification</label><input name="qualification" required className="input-field" placeholder="e.g. B.Tech, MBA" /></div>
                                    <div className="form-group"><label>Total Experience (Years)</label><input name="experienceYears" required className="input-field" placeholder="e.g. 5 Years" /></div>
                                    <div className="form-group"><label>PF Number (If any)</label><input name="pfNumber" className="input-field" placeholder="UAN / PF No." /></div>
                                    <div className="form-group"><label>Expected CTC / Proposed CTC</label><input name="ctc" className="input-field" placeholder="Annual CTC" /></div>
                                </div>
                            </section>

                            {/* Bank Details */}
                            <section>
                                <h3 className="section-title text-sm uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">3</div>
                                    Bank Account Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group"><label>Account Holder Name</label><input name="accName" required className="input-field" /></div>
                                    <div className="form-group"><label>Account Number</label><input name="accNum" required className="input-field" /></div>
                                    <div className="form-group"><label>Bank Name</label><input name="bankName" required className="input-field" /></div>
                                    <div className="form-group"><label>IFSC Code</label><input name="ifsc" required className="input-field" /></div>
                                </div>
                            </section>

                            {/* Emergency & Insurance */}
                            <section>
                                <h3 className="section-title text-sm uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">4</div>
                                    Emergency & Insurance
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group"><label>Emergency Contact Name</label><input name="emergencyName" required className="input-field" /></div>
                                    <div className="form-group"><label>Relationship</label><input name="emergencyRel" required className="input-field" /></div>
                                    <div className="form-group"><label>Emergency Phone</label><input name="emergencyPhone" required className="input-field" /></div>
                                    <div className="form-group"><label>Insurance Type (If any)</label><input name="insuranceType" className="input-field" placeholder="Medical/Life" /></div>
                                    <div className="form-group col-span-2"><label>Policy Number</label><input name="policyNumber" className="input-field" /></div>
                                </div>
                            </section>

                            <div className="pt-6 border-t flex justify-end">
                                <button type="submit" className="btn-primary px-8">Complete Form Submission</button>
                            </div>
                        </form>
                    </div>
                )}

                {onboardingStatus === 'FORM_SUBMITTED' && (
                    <div className="card p-12 text-center max-w-xl mx-auto">
                        <Clock size={64} className="text-warning mx-auto mb-6 opacity-50" />
                        <h2>Details Under Review</h2>
                        <p className="text-secondary">Your information is being reviewed. Once verified, your account will be fully activated.</p>
                    </div>
                )}

                {onboardingStatus === 'NOT_JOINED' && (
                    <div className="card p-12 text-center max-w-xl mx-auto">
                        <AlertTriangle size={64} className="text-warning mx-auto mb-6 opacity-30" />
                        <h2>Onboarding Not Started</h2>
                        <p className="text-secondary text-lg">Your onboarding has not been triggered yet. Please contact HR or your manager if you believe this is an error.</p>
                    </div>
                )}

                {onboardingStatus === 'COMPLETED' && (
                    <div className="card p-12 text-center max-w-xl mx-auto bg-green-50/30 border-green-100">
                        <CheckCircle size={80} className="text-success mx-auto mb-6 pulse" />
                        <h2 className="text-success text-3xl font-bold mb-2">You're All Set!</h2>
                        <p className="text-gray-600 mb-8">Congratulations! Your onboarding is complete. You can now access all features of the HEMS portal.</p>
                        <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Onboarding;

