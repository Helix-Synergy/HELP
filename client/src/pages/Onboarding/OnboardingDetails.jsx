import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FileText, Eye, CheckCircle, XCircle, ArrowLeft, 
    User, Mail, Phone, Calendar, MapPin, CreditCard, 
    Briefcase, ShieldCheck, HeartPulse, Building2,
    ClipboardList, AlertCircle, Clock, UserCheck
} from 'lucide-react';
import api from '../../api/axios';
import './Onboarding.css';

const OnboardingDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [onboarding, setOnboarding] = useState(null);
    const [verifyRemarks, setVerifyRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [userId]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/onboarding/user/${userId}`);
            setOnboarding(res.data.data);
            setVerifyRemarks(res.data.data.personalForm?.remarks || '');
        } catch (error) {
            console.error("Error fetching onboarding details:", error);
            alert("Failed to load employee details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyDocs = async (status) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} these documents?`)) return;
        setIsSubmitting(true);
        try {
            await api.put(`/onboarding/verify-docs/${userId}`, { status, remarks: verifyRemarks });
            alert(`Documents ${status.toLowerCase()} successfully`);
            fetchDetails();
        } catch (error) {
            alert('Verification failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyForm = async (status) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this form?`)) return;
        setIsSubmitting(true);
        try {
            await api.put(`/onboarding/verify-form/${userId}`, { status, remarks: verifyRemarks });
            alert(`Form ${status.toLowerCase()} successfully`);
            fetchDetails();
        } catch (error) {
            alert('Verification failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-secondary">Loading Onboarding Details...</p>
            </div>
        </div>
    );

    if (!onboarding) return (
        <div className="p-12 text-center">
            <AlertCircle size={48} className="text-danger mx-auto mb-4" />
            <h3>Onboarding Record Not Found</h3>
            <button className="btn-secondary mt-4" onClick={() => navigate('/onboarding')}>Back to List</button>
        </div>
    );

    const { user, documents, personalForm } = onboarding;
    const currentStatus = user?.onboardingStatus;

    return (
        <motion.div 
            className="onboarding-page max-w-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between mb-8">
                <button 
                    className="flex items-center gap-2 text-secondary hover:text-primary font-medium transition-colors"
                    onClick={() => navigate('/onboarding')}
                >
                    <ArrowLeft size={20} /> Back to Pipeline
                </button>
                <div className={`status-pill ${currentStatus?.toLowerCase()}`}>
                    {currentStatus?.replace(/_/g, ' ')}
                </div>
            </div>

            <header className="mb-10">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                        <User size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-primary mb-1">{user?.firstName} {user?.lastName}</h1>
                        <div className="flex items-center gap-4 text-secondary text-sm">
                            <span className="flex items-center gap-1"><Mail size={14} /> {user?.email}</span>
                            <span className="flex items-center gap-1"><Briefcase size={14} /> Employee ID: {user?.employeeId || 'Pending'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Documents View */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-accent"/> Submitted Documents</h3>
                            <span className="text-xs font-bold text-secondary uppercase bg-white px-3 py-1 rounded-full border">Step 1</span>
                        </div>
                        <div className="p-6 space-y-4">
                            {documents?.map(doc => (
                                <div key={doc._id} className="p-4 border rounded-xl hover:border-accent/30 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${doc.status === 'APPROVED' ? 'bg-green-50 text-success' : 'bg-blue-50 text-accent'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-primary">{doc.name}</div>
                                            <div className="text-xs text-secondary italic">Status: {doc.status}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {doc.fileUrl ? (
                                            <a 
                                                href={doc.fileUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/5 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors"
                                            >
                                                <Eye size={16} /> View
                                            </a>
                                        ) : (
                                            <span className="text-danger text-xs font-bold bg-danger/5 px-3 py-1 rounded-full">Missing</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {currentStatus === 'DOCUMENTS_SUBMITTED' && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
                                <textarea 
                                    className="input-field min-h-[80px]" 
                                    placeholder="Document verification remarks..."
                                    value={verifyRemarks}
                                    onChange={(e) => setVerifyRemarks(e.target.value)}
                                ></textarea>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        className="bg-danger/10 text-danger px-6 py-2 rounded-xl font-bold hover:bg-danger/20 transition-all"
                                        onClick={() => handleVerifyDocs('REJECTED')}
                                        disabled={isSubmitting}
                                    >
                                        Reject Documents
                                    </button>
                                    <button 
                                        className="btn-primary px-8 py-2 rounded-xl shadow-lg shadow-accent/20"
                                        onClick={() => handleVerifyDocs('APPROVED')}
                                        disabled={isSubmitting}
                                    >
                                        Approve All Documents
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Detailed Form View */}
                    {personalForm && (
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2"><ClipboardList size={20} className="text-accent"/> Detailed Employee Form</h3>
                                <span className="text-xs font-bold text-secondary uppercase bg-white px-3 py-1 rounded-full border">Step 2</span>
                            </div>
                            
                            <div className="p-6 space-y-10">
                                {/* Personal & Contact */}
                                <div className="space-y-4">
                                    <h4 className="text-xs uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> Personal & Identity
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><User size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Father's Name</div><div className="font-semibold">{personalForm.fathersName}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><Calendar size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Date of Birth</div><div className="font-semibold">{personalForm.dateOfBirth ? new Date(personalForm.dateOfBirth).toLocaleDateString() : 'N/A'}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><HeartPulse size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Blood Group</div><div className="font-semibold">{personalForm.bloodGroup}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><CreditCard size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Aadhar Number</div><div className="font-semibold">{personalForm.aadharNumber}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><CreditCard size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">PAN Number</div><div className="font-semibold uppercase">{personalForm.panNumber}</div></div>
                                        </div>
                                        <div className="flex gap-3 md:col-span-2">
                                            <div className="text-accent mt-0.5"><MapPin size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Residential Address</div><div className="font-semibold leading-relaxed">{personalForm.address}</div></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional */}
                                <div className="space-y-4">
                                    <h4 className="text-xs uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> Professional & Financial
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><Briefcase size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Qualification</div><div className="font-semibold">{personalForm.qualification}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><Briefcase size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Experience</div><div className="font-semibold">{personalForm.experienceYears}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><ShieldCheck size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">PF Number</div><div className="font-semibold">{personalForm.pfNumber || 'N/A'}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><div className="font-bold text-lg">$</div></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Proposed CTC</div><div className="font-bold text-accent text-lg">{personalForm.ctc}</div></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank */}
                                <div className="space-y-4">
                                    <h4 className="text-xs uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div> Bank Account Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><Building2 size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Bank Name</div><div className="font-semibold">{personalForm.bankDetails?.bankName}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><User size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Account Holder</div><div className="font-semibold">{personalForm.bankDetails?.accountHolderName}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><CreditCard size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">Account Number</div><div className="font-semibold font-mono tracking-wider">{personalForm.bankDetails?.accountNumber}</div></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-accent mt-0.5"><ShieldCheck size={18}/></div>
                                            <div><div className="text-[10px] uppercase text-secondary font-bold mb-1">IFSC Code</div><div className="font-semibold font-mono">{personalForm.bankDetails?.ifscCode}</div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {currentStatus === 'FORM_SUBMITTED' && (
                                <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
                                    <textarea 
                                        className="input-field min-h-[80px]" 
                                        placeholder="Form verification remarks..."
                                        value={verifyRemarks}
                                        onChange={(e) => setVerifyRemarks(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end gap-3">
                                        <button 
                                            className="bg-danger/10 text-danger px-6 py-2 rounded-xl font-bold hover:bg-danger/20 transition-all"
                                            onClick={() => handleVerifyForm('REJECTED')}
                                            disabled={isSubmitting}
                                        >
                                            Reject Form
                                        </button>
                                        <button 
                                            className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-accent/20 flex items-center gap-2"
                                            onClick={() => handleVerifyForm('APPROVED')}
                                            disabled={isSubmitting}
                                        >
                                            <UserCheck size={20} /> Verify & Complete Onboarding
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Activity & History */}
                    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-6 flex items-center gap-2">
                            <Clock size={16} /> Verification Timeline
                        </h3>
                        <div className="space-y-6">
                            <div className="flex gap-3 relative">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 z-10">
                                    <CheckCircle size={16} />
                                </div>
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100"></div>
                                <div>
                                    <div className="text-sm font-bold text-primary">Onboarding Triggered</div>
                                    <div className="text-[10px] text-secondary font-medium uppercase mt-1">Status: JOINED</div>
                                </div>
                            </div>

                            <div className={`flex gap-3 relative`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${['DOCUMENTS_VERIFIED', 'FORM_PENDING', 'FORM_SUBMITTED', 'COMPLETED'].includes(currentStatus) ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-accent'}`}>
                                    {['DOCUMENTS_VERIFIED', 'FORM_PENDING', 'FORM_SUBMITTED', 'COMPLETED'].includes(currentStatus) ? <CheckCircle size={16} /> : <FileText size={16} />}
                                </div>
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100"></div>
                                <div>
                                    <div className="text-sm font-bold text-primary">Document Verification</div>
                                    {personalForm?.submittedAt && <div className="text-[10px] text-secondary font-medium uppercase mt-1">Verified</div>}
                                </div>
                            </div>

                            <div className={`flex gap-3`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${currentStatus === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-warning'}`}>
                                    {currentStatus === 'COMPLETED' ? <CheckCircle size={16} /> : <ClipboardList size={16} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-primary">Final Approval</div>
                                    <div className="text-[10px] text-secondary font-medium uppercase mt-1">{currentStatus === 'COMPLETED' ? 'Completed' : 'Pending'}</div>
                                </div>
                            </div>
                        </div>

                        {personalForm?.remarks && (
                            <div className="mt-8 pt-8 border-t border-gray-50">
                                <h4 className="text-[10px] uppercase font-bold text-secondary mb-3 flex items-center gap-1.5"><AlertCircle size={12}/> Current Admin Remarks</h4>
                                <div className="p-3 bg-blue-50/50 rounded-xl text-xs text-secondary leading-relaxed italic border border-blue-100">
                                    "{personalForm.remarks}"
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </motion.div>
    );
};

export default OnboardingDetails;
