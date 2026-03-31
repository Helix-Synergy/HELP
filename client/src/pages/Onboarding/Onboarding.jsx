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
    const [showVerifyDocsModal, setShowVerifyDocsModal] = useState(false);
    const [showVerifyFormModal, setShowVerifyFormModal] = useState(false);
    const [verifyRemarks, setVerifyRemarks] = useState('');

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

    const fetchEmployeeData = async () => {
        setIsLoading(true);
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
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post(`/onboarding/upload/${docId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('File uploaded successfully');
            fetchEmployeeData();
        } catch (error) {
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

    const verifyDocs = async (userId, status) => {
        try {
            await api.put(`/onboarding/verify-docs/${userId}`, { status, remarks: verifyRemarks });
            alert(`Documents ${status.toLowerCase()} successfully`);
            setShowVerifyDocsModal(false);
            setVerifyRemarks('');
            fetchAdminData();
        } catch (error) {
            alert('Verification failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const verifyFormAction = async (userId, status) => {
        try {
            await api.put(`/onboarding/verify-form/${userId}`, { status, remarks: verifyRemarks });
            alert(`Form ${status.toLowerCase()} successfully`);
            setShowVerifyFormModal(false);
            setVerifyRemarks('');
            fetchAdminData();
        } catch (error) {
            alert('Verification failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
            const res = await api.get(`/users/${userId}`);
            setUserDetails(res.data.data);
            const detailRes = await api.get(`/onboarding/me`); // Need a way for admin to see others details
            // For now, let's just use the selectedUser from the list which has basic info, 
            // and we'll fetch the full OnboardingDetail in a new endpoint or update existing.
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    const fetchSelectedUserDetail = async (userId) => {
        setIsLoading(true);
        try {
            // Need a new endpoint: GET /api/v1/onboarding/user/:userId
            const res = await api.get(`/onboarding/user/${userId}`);
            setMyOnboarding(res.data.data);
        } catch (error) {
            console.error("Error fetching user detail:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const [showTriggerModal, setShowTriggerModal] = useState(false);
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
                                                <button className="btn-primary py-1 px-3 text-sm" onClick={() => { 
                                                    setSelectedUser(u); 
                                                    fetchSelectedUserDetail(u._id);
                                                    setShowVerifyDocsModal(true); 
                                                }}>
                                                    Verify Docs
                                                </button>
                                            )}
                                            {u.onboardingStatus === 'COMPLETED' && (
                                                <button className="text-accent hover:underline text-xs mr-3 font-semibold" onClick={() => {
                                                    setSelectedUser(u);
                                                    fetchSelectedUserDetail(u._id);
                                                    setShowVerifyDocsModal(true);
                                                }}>
                                                    Docs
                                                </button>
                                            )}
                                            {u.onboardingStatus === 'FORM_SUBMITTED' && (
                                                <button className="btn-primary py-1 px-3 text-sm" onClick={() => { 
                                                    setSelectedUser(u); 
                                                    fetchSelectedUserDetail(u._id);
                                                    setShowVerifyFormModal(true); 
                                                }}>
                                                    Verify Form
                                                </button>
                                            )}
                                            {u.onboardingStatus === 'COMPLETED' && (
                                                <button className="btn-secondary py-1 px-3 text-sm flex items-center gap-1 mx-auto" onClick={() => { 
                                                    setSelectedUser(u); 
                                                    fetchSelectedUserDetail(u._id);
                                                    setShowVerifyFormModal(true); 
                                                }}>
                                                    <Eye size={14} /> View Details
                                                </button>
                                            )}
                                            {['DOCUMENTS_PENDING', 'FORM_PENDING'].includes(u.onboardingStatus) && (
                                                <span className="text-xs text-secondary italic">Waiting for Employee</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Verify Docs Modal */}
                {showVerifyDocsModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3>Verify Documents: {selectedUser?.firstName}</h3>
                                <button onClick={() => setShowVerifyDocsModal(false)}><X /></button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                {myOnboarding?.documents.map(doc => (
                                    <div key={doc._id} className="p-3 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="font-bold">{doc.name}</div>
                                            <div className="text-xs text-secondary italic">Uploaded: {new Date(doc.updatedAt).toLocaleString()}</div>
                                        </div>
                                        {doc.fileUrl ? (
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-accent flex items-center gap-1 font-semibold">
                                                <Eye size={16} /> View Document
                                            </a>
                                        ) : (
                                            <span className="text-danger text-xs">Not Uploaded</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <textarea 
                                className="input-field mb-4" 
                                placeholder="Admin Remarks..." 
                                value={verifyRemarks} 
                                onChange={e => setVerifyRemarks(e.target.value)}
                                disabled={selectedUser?.onboardingStatus === 'COMPLETED'}
                            ></textarea>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button className="btn-secondary" onClick={() => setShowVerifyDocsModal(false)}>{selectedUser?.onboardingStatus === 'COMPLETED' ? 'Close' : 'Cancel'}</button>
                                {selectedUser?.onboardingStatus !== 'COMPLETED' && (
                                    <>
                                        <button className="bg-danger text-white px-6 py-2 rounded-lg font-bold" onClick={() => verifyDocs(selectedUser._id, 'REJECTED')}>Reject Docs</button>
                                        <button className="btn-primary px-6" onClick={() => verifyDocs(selectedUser._id, 'APPROVED')}>Approve All</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Verify Form Modal */}
                {showVerifyFormModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3>Employee Detailed Form: {selectedUser?.firstName}</h3>
                                <button onClick={() => setShowVerifyFormModal(false)}><X /></button>
                            </div>

                            {myOnboarding?.personalForm && (
                                <div className="space-y-6 mb-8">
                                    <section className="bg-gray-50 p-4 rounded-xl">
                                        <h4 className="text-xs uppercase tracking-widest text-secondary mb-3">Personal & Contact</h4>
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <div className="text-secondary">Father's Name:</div><div className="font-medium">{myOnboarding.personalForm.fathersName}</div>
                                            <div className="text-secondary">DOB:</div><div className="font-medium">{myOnboarding.personalForm.dateOfBirth ? new Date(myOnboarding.personalForm.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                                            <div className="text-secondary">Blood Group:</div><div className="font-medium">{myOnboarding.personalForm.bloodGroup}</div>
                                            <div className="text-secondary">Aadhar:</div><div className="font-medium">{myOnboarding.personalForm.aadharNumber}</div>
                                            <div className="text-secondary">PAN:</div><div className="font-medium">{myOnboarding.personalForm.panNumber}</div>
                                            <div className="text-secondary col-span-2 border-t pt-2 mt-1">Current Address:</div>
                                            <div className="font-medium col-span-2 text-xs">{myOnboarding.personalForm.address}</div>
                                        </div>
                                    </section>

                                    <section className="bg-gray-50 p-4 rounded-xl">
                                        <h4 className="text-xs uppercase tracking-widest text-secondary mb-3">Professional & Financial</h4>
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <div className="text-secondary">Qualification:</div><div className="font-medium">{myOnboarding.personalForm.qualification}</div>
                                            <div className="text-secondary">Experience:</div><div className="font-medium">{myOnboarding.personalForm.experienceYears}</div>
                                            <div className="text-secondary">PF Num:</div><div className="font-medium">{myOnboarding.personalForm.pfNumber || 'N/A'}</div>
                                            <div className="text-secondary">CTC:</div><div className="font-medium text-accent font-bold">{myOnboarding.personalForm.ctc}</div>
                                        </div>
                                    </section>

                                    <section className="bg-gray-50 p-4 rounded-xl">
                                        <h4 className="text-xs uppercase tracking-widest text-secondary mb-3">Bank Details</h4>
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <div className="text-secondary">Holder Name:</div><div className="font-medium">{myOnboarding.personalForm.bankDetails?.accountHolderName}</div>
                                            <div className="text-secondary">Account No:</div><div className="font-medium">{myOnboarding.personalForm.bankDetails?.accountNumber}</div>
                                            <div className="text-secondary">Bank Name:</div><div className="font-medium">{myOnboarding.personalForm.bankDetails?.bankName}</div>
                                            <div className="text-secondary">IFSC:</div><div className="font-medium">{myOnboarding.personalForm.bankDetails?.ifscCode}</div>
                                        </div>
                                    </section>

                                    <section className="bg-gray-50 p-4 rounded-xl">
                                        <h4 className="text-xs uppercase tracking-widest text-secondary mb-3">Emergency & Insurance</h4>
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <div className="text-secondary">Emergency:</div><div className="font-medium">{myOnboarding.personalForm.emergencyContact?.name} ({myOnboarding.personalForm.emergencyContact?.relationship})</div>
                                            <div className="text-secondary">E-Phone:</div><div className="font-medium">{myOnboarding.personalForm.emergencyContact?.phone}</div>
                                            <div className="text-secondary border-t pt-2 mt-1">Insurance Type:</div><div className="font-medium border-t pt-2 mt-1">{myOnboarding.personalForm.insuranceDetails?.policyType || 'N/A'}</div>
                                            <div className="text-secondary">Policy Num:</div><div className="font-medium">{myOnboarding.personalForm.insuranceDetails?.policyNumber || 'N/A'}</div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            <textarea 
                                className="input-field mb-4" 
                                placeholder="Feedback/Remarks..." 
                                value={verifyRemarks || myOnboarding?.personalForm?.remarks || ''} 
                                onChange={e => setVerifyRemarks(e.target.value)}
                                disabled={selectedUser?.onboardingStatus === 'COMPLETED'}
                            ></textarea>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button className="btn-secondary" onClick={() => setShowVerifyFormModal(false)}>Close</button>
                                {selectedUser?.onboardingStatus !== 'COMPLETED' && (
                                    <>
                                        <button className="bg-danger text-white px-6 py-2 rounded-lg font-bold" onClick={() => verifyFormAction(selectedUser._id, 'REJECTED')}>Reject Form</button>
                                        <button className="btn-primary px-6" onClick={() => verifyFormAction(selectedUser._id, 'APPROVED')}>Verify & Complete Onboarding</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
                        <h2 className="mb-2">Phase 1: Mandatory Documents</h2>
                        <p className="text-secondary mb-8">Please upload the Following documents for HR verification.</p>
                        
                        <div className="space-y-4 text-left">
                            {myOnboarding?.documents.map(doc => (
                                <div key={doc._id} className="document-upload-row p-4 border rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            {doc.status === 'APPROVED' ? <CheckCircle className="text-success" /> : <FileText className="text-secondary" />}
                                        </div>
                                        <div>
                                            <div className="font-medium">{doc.name}</div>
                                            <div className="text-xs text-secondary">Status: <strong className={doc.status === 'APPROVED' ? 'text-success' : 'text-accent'}>{doc.status}</strong></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {doc.status !== 'APPROVED' && (
                                            <label className="btn-secondary py-1 px-4 text-sm cursor-pointer hover:bg-gray-100">
                                                <Upload size={14} className="mr-2 inline" /> {doc.fileUrl ? 'Change' : 'Upload'}
                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(doc._id, e.target.files[0])} />
                                            </label>
                                        )}
                                        {doc.fileUrl && (
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-gray-50 rounded-lg"><Eye size={18} /></a>
                                        )}
                                    </div>
                                </div>
                            ))}
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

