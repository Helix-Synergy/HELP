import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, Save, User as UserIcon, Briefcase, 
    CreditCard, Calendar, Phone, MapPin, 
    ShieldCheck, TrendingUp, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import './EditEmployee.css';

const EditEmployee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const [employee, setEmployee] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'EMPLOYEE',
        designation: '',
        status: 'ACTIVE',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: 'Male',
        maritalStatus: 'Unmarried',
        ctc: '',
        resignationDate: '',
        resignationReason: '',
        workMode: 'WFO',
        performanceFactor: 100,
        isPFApplicable: true,
        isBonusApplicable: true,
        taxPercent: 0,
        managerId: ''
    });
    const [managers, setManagers] = useState([]);

    useEffect(() => {
        fetchEmployee();
        fetchManagers();
    }, [id]);

    const fetchManagers = async () => {
        try {
            const res = await api.get('/users');
            if (res.data.success) {
                // Potential managers are anyone with MANAGER, HR_ADMIN, or SUPER_ADMIN role
                const potentialManagers = res.data.data.filter(u => 
                    ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(u.role) && u._id !== id
                );
                setManagers(potentialManagers);
            }
        } catch (err) {
            console.error("Failed to fetch managers:", err);
        }
    };

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/${id}`);
            if (res.data.success) {
                const raw = res.data.data;
                setEmployee(raw);
                setFormData({
                    firstName: raw.firstName || '',
                    lastName: raw.lastName || '',
                    email: raw.email || '',
                    role: raw.role || 'EMPLOYEE',
                    designation: raw.designation || '',
                    status: raw.status || 'ACTIVE',
                    phone: raw.contactDetails?.phone || '',
                    address: raw.contactDetails?.address || '',
                    dateOfBirth: raw.dateOfBirth ? raw.dateOfBirth.split('T')[0] : '',
                    gender: raw.gender || 'Male',
                    maritalStatus: raw.maritalStatus || 'Unmarried',
                    ctc: raw.ctc || '',
                    resignationDate: raw.resignationDate ? raw.resignationDate.split('T')[0] : '',
                    resignationReason: raw.resignationReason || '',
                    workMode: raw.workMode || 'WFO',
                    performanceFactor: raw.performanceFactor !== undefined ? raw.performanceFactor : 100,
                    isPFApplicable: raw.isPFApplicable !== undefined ? raw.isPFApplicable : true,
                    isBonusApplicable: raw.isBonusApplicable !== undefined ? raw.isBonusApplicable : true,
                    taxPercent: raw.taxPercent || 0,
                    managerId: raw.managerId || ''
                });
            }
        } catch (err) {
            alert('Failed to fetch employee details');
            navigate('/directory');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsAvatarUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post(`/users/${id}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEmployee(prev => ({ ...prev, profilePicture: res.data.data.profilePicture }));
        } catch (error) {
            alert('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsAvatarUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!window.confirm('Are you sure you want to remove this profile picture?')) return;
        setIsAvatarUploading(true);
        try {
            await api.delete(`/users/${id}/avatar`);
            setEmployee(prev => ({ ...prev, profilePicture: null }));
        } catch (error) {
            alert('Removal failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsAvatarUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/users/${id}`, formData);
            alert('Profile Updated Successfully');
            navigate('/directory');
        } catch (err) {
            alert('Error updating profile: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <motion.div 
            className="edit-employee-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="edit-header">
                <div className="flex items-center gap-4">
                    <Link to="/directory" className="back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="breadcrumbs">
                            <Link to="/directory">Directory</Link>
                            <span>/</span>
                            <span className="current">Edit Profile</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {formData.firstName} {formData.lastName}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => navigate('/directory')}
                    >
                        Cancel
                    </button>
                    <button 
                        form="editForm"
                        type="submit" 
                        className="btn-primary flex items-center gap-2"
                        disabled={isSubmitting}
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="edit-container">
                <form id="editForm" onSubmit={handleUpdate} className="edit-form-grid">
                    {/* Left Column - Main Details */}
                    <div className="main-column space-y-6">
                        {/* Section: Account Info */}
                        <div className="form-section card">
                            <div className="section-header">
                                <UserIcon size={20} className="text-blue-500" />
                                <h2>Account Information</h2>
                            </div>
                            
                            <div className="avatar-upload-section mb-10 flex items-center gap-6 p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <div className="relative group w-24 h-24">
                                    <div className="w-24 h-24 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-primary overflow-hidden">
                                        {employee?.profilePicture ? (
                                            <img src={employee.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-3xl font-bold text-blue-500">
                                                {formData.firstName?.[0]}{formData.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    {isAvatarUploading && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl z-10">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-800 mb-1">Employee Profile Photo</h4>
                                    <p className="text-xs text-gray-500 mb-3">Upload a professional photo for the directory.</p>
                                    <div className="flex items-center gap-3">
                                        <label className="btn-secondary py-1.5 px-4 text-xs cursor-pointer inline-flex items-center gap-2">
                                            <UserIcon size={14} />
                                            {employee?.profilePicture ? 'Change Photo' : 'Upload Photo'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isAvatarUploading} />
                                        </label>
                                        {employee?.profilePicture && (
                                            <button 
                                                type="button"
                                                className="text-danger text-xs font-bold hover:underline"
                                                onClick={handleRemoveAvatar}
                                                disabled={isAvatarUploading}
                                            >
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input 
                                        type="text" required 
                                        className="input-field" 
                                        value={formData.firstName} 
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input 
                                        type="text" required 
                                        className="input-field" 
                                        value={formData.lastName} 
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" required 
                                        className="input-field" 
                                        value={formData.email} 
                                        onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Designation</label>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        value={formData.designation} 
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Personal Details */}
                        <div className="form-section card">
                            <div className="section-header">
                                <Phone size={20} className="text-purple-500" />
                                <h2>Personal Details</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        className="input-field" 
                                        value={formData.phone} 
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        value={formData.dateOfBirth} 
                                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select 
                                        className="input-field" 
                                        value={formData.gender} 
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Marital Status</label>
                                    <select 
                                        className="input-field" 
                                        value={formData.maritalStatus} 
                                        onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                                    >
                                        <option>Unmarried</option>
                                        <option>Married</option>
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Full Address</label>
                                    <textarea 
                                        className="input-field min-h-[100px]" 
                                        value={formData.address} 
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Work & Payroll */}
                    <div className="sidebar-column space-y-6">
                        {/* Section: Employment Details */}
                        <div className="form-section card">
                            <div className="section-header">
                                <Briefcase size={20} className="text-orange-500" />
                                <h2>Employment</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="form-group">
                                    <label>System Role</label>
                                    <select 
                                        className="input-field" 
                                        value={formData.role} 
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="FINANCE">Finance</option>
                                        <option value="HR_ADMIN">HR Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select 
                                        className="input-field" 
                                        value={formData.status} 
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Resigned / Inactive</option>
                                        <option value="PROBATION">Probation</option>
                                        <option value="NOTICE_PERIOD">Notice Period</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reporting Manager</label>
                                    <select 
                                        className="input-field" 
                                        value={formData.managerId} 
                                        onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                    >
                                        <option value="">No Manager (Self/Direct)</option>
                                        {managers.map(m => (
                                            <option key={m._id} value={m._id}>
                                                {m.firstName} {m.lastName} ({m.role.replace('_', ' ')})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Annual CTC (₹)</label>
                                    <input 
                                        type="number" 
                                        className="input-field" 
                                        value={formData.ctc} 
                                        onChange={e => setFormData({ ...formData, ctc: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Payroll & Performance */}
                        <div className="form-section card payroll-section">
                            <div className="section-header">
                                <TrendingUp size={20} className="text-green-500" />
                                <h2>Payroll & Performance</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="form-group">
                                    <label>Work Mode</label>
                                    <select 
                                        className="input-field" 
                                        value={formData.workMode} 
                                        onChange={e => setFormData({ ...formData, workMode: e.target.value })}
                                    >
                                        <option value="WFO">WFO (Office)</option>
                                        <option value="WFH">WFH (Home)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Performance Factor (%)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="input-field pr-10" 
                                            value={formData.performanceFactor} 
                                            onChange={e => setFormData({ ...formData, performanceFactor: e.target.value })} 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Tax Percentage (%)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" step="0.01" 
                                            className="input-field pr-10" 
                                            value={formData.taxPercent} 
                                            onChange={e => setFormData({ ...formData, taxPercent: e.target.value })} 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                    </div>
                                </div>
                                <div className="pt-2 space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={formData.isPFApplicable} 
                                            onChange={e => setFormData({ ...formData, isPFApplicable: e.target.checked })} 
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">PF Contribution</span>
                                            <span className="text-[10px] text-gray-500">Enable Provident Fund deduction</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            checked={formData.isBonusApplicable} 
                                            onChange={e => setFormData({ ...formData, isBonusApplicable: e.target.checked })} 
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">Bonus Eligibility</span>
                                            <span className="text-[10px] text-gray-500">Include in annual bonus runs</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section: Resignation Details (Conditional) */}
                        {formData.status === 'INACTIVE' && (
                            <motion.div 
                                className="form-section card border-red-100 bg-red-50/20"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="section-header">
                                    <AlertCircle size={20} className="text-red-500" />
                                    <h2 className="text-red-700">Resignation Details</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label>Resignation Date</label>
                                        <input 
                                            type="date" 
                                            className="input-field border-red-200 focus:ring-red-500" 
                                            value={formData.resignationDate} 
                                            onChange={e => setFormData({ ...formData, resignationDate: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Reason for Resignation</label>
                                        <textarea 
                                            className="input-field border-red-200 focus:ring-red-500 min-h-[80px]" 
                                            value={formData.resignationReason} 
                                            onChange={e => setFormData({ ...formData, resignationReason: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default EditEmployee;
