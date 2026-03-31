import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, Plus, Grid as GridIcon, List as ListIcon, MoreVertical, 
    Mail, Phone, X, CheckCircle, Key, Copy, ExternalLink, ShieldCheck 
} from 'lucide-react';
import api from '../../api/axios';
import './Directory.css';

const Directory = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE',
        designation: '', status: 'ACTIVE',
        phone: '', address: '', dateOfBirth: '', gender: 'Male', maritalStatus: 'Unmarried',
        ctc: '', resignationDate: '', resignationReason: '',
        workMode: 'WFO', performanceFactor: 100, isPFApplicable: true, isBonusApplicable: true, taxPercent: 0
    });

    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            // Format data for UI compatibility
            const formatted = res.data.data.map(u => ({
                id: u._id,
                name: `${u.firstName} ${u.lastName}`,
                role: u.role.replace('_', ' '),
                dept: u.departmentId?.name || 'General',
                email: u.email,
                phone: u.contactDetails?.phone || 'N/A',
                status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
                onboardingStatus: u.onboardingStatus,
                initials: `${u.firstName[0]}${u.lastName[0]}`,
                raw: u
            }));
            setEmployees(formatted);
        } catch (err) {
            console.error('Failed to fetch employees', err);
        }
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 10; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setFormData({ ...formData, password: retVal });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/users', formData);
            setCreatedUser({ ...formData, id: res.data.data._id });
            setShowAddModal(false);
            setShowSuccessModal(true);
            fetchEmployees();
            setFormData({
                firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE',
                phone: '', address: '', dateOfBirth: '', gender: 'Male', maritalStatus: 'Unmarried'
            });
        } catch (err) {
            alert('Error adding employee: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (emp) => {
        const id = emp.raw._id || emp.id;
        navigate(`/directory/edit/${id}`);
        setOpenMenuId(null);
    };


    return (
        <motion.div
            className="directory-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Employee Directory</h1>
                    <p className="page-subtitle">Manage and view all team members across the organization.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Employee
                </button>
            </div>

            <div className="directory-toolbar card">
                <div className="toolbar-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, role, or department..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="toolbar-actions">
                    <button className="icon-btn filter-btn">
                        <Filter size={18} /> Filters
                    </button>
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <GridIcon size={18} />
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        className="employee-grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {filteredEmployees.map(emp => (
                            <motion.div
                                key={emp.id}
                                className="card emp-card cursor-pointer"
                                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                                onClick={() => handleEditClick(emp)}
                            >
                                <div className="emp-card-header">
                                    <span className={`status-badge ${emp.status === 'Active' ? 'bg-success' : emp.status === 'INACTIVE' ? 'bg-error' : 'bg-warning'}`}>
                                        {emp.status === 'INACTIVE' ? 'Resigned' : emp.status}
                                    </span>
                                    <div className="relative">
                                        <button 
                                            className="icon-btn-small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {openMenuId === emp.id && (
                                                <motion.div 
                                                    className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                >
                                                    <button 
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                        onClick={() => handleEditClick(emp)}
                                                    >
                                                        Edit
                                                    </button>
                                                    {emp.onboardingStatus === 'NOT_JOINED' && (
                                                        <button 
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post(`/onboarding/trigger/${emp.id}`);
                                                                    alert('Onboarding Triggered successfully!');
                                                                    fetchEmployees();
                                                                } catch (err) {
                                                                    alert('Failed: ' + (err.response?.data?.error || err.message));
                                                                }
                                                            }}
                                                        >
                                                            Trigger Onboarding
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="emp-card-body">
                                    <div className="emp-avatar">{emp.initials}</div>
                                    <h3 className="emp-name">{emp.name}</h3>
                                    <p className="emp-role">{emp.role}</p>
                                    <span className="dept-pill">{emp.dept}</span>
                                </div>
                                <div className="emp-card-footer">
                                    <a href={`mailto:${emp.email}`} className="contact-btn" onClick={e => e.stopPropagation()}><Mail size={16} /> Email</a>
                                    <a href={emp.phone !== 'N/A' ? `tel:${emp.phone}` : '#'} className={`contact-btn ${emp.phone === 'N/A' ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={e => e.stopPropagation()}>
                                        <Phone size={16} /> Call
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        className="card employee-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="cursor-pointer" onClick={() => handleEditClick(emp)}>
                                        <td>
                                            <div className="list-emp-info">
                                                <div className="emp-avatar-small">{emp.initials}</div>
                                                <div>
                                                    <div className="emp-name-small">{emp.name}</div>
                                                    <div className="emp-email-small">{emp.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{emp.role}</td>
                                        <td><span className="dept-pill">{emp.dept}</span></td>
                                        <td>
                                            <span className={`status-badge ${emp.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="relative">
                                            <button 
                                                className="icon-btn-small text-secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                                                }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            <AnimatePresence>
                                                {openMenuId === emp.id && (
                                                    <motion.div 
                                                        className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                    >
                                                        <button 
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                                            onClick={() => handleEditClick(emp)}
                                                        >
                                                            Edit
                                                        </button>
                                                        {emp.onboardingStatus === 'NOT_JOINED' && (
                                                            <button 
                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.post(`/onboarding/trigger/${emp.id}`);
                                                                        alert('Onboarding Triggered successfully!');
                                                                        fetchEmployees();
                                                                    } catch (err) {
                                                                        alert('Failed: ' + (err.response?.data?.error || err.message));
                                                                    }
                                                                }}
                                                            >
                                                                Trigger Onboarding
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>

            {filteredEmployees.length === 0 && (
                <div className="empty-state">
                    <p>No employees found matching "{searchTerm}"</p>
                </div>
            )}

            {/* Add Employee Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold">Add New Employee</h2>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setShowAddModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="addEmployeeForm" onSubmit={handleAddSubmit} className="space-y-6">
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                            Admins should only provide account credentials. Personal, professional, and financial details will be collected from the joiner during the onboarding process.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group flex-1">
                                            <label>First Name</label>
                                            <input type="text" required className="input-field" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Last Name</label>
                                            <input type="text" required className="input-field" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Email Address</label>
                                            <input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="m-0">Temporary Password</label>
                                                <button type="button" onClick={generatePassword} className="text-xs text-accent font-bold hover:underline">Generate</button>
                                            </div>
                                            <input type="text" required className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                        <div className="form-group col-span-2 cursor-pointer">
                                            <label>System Role</label>
                                            <select className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                                <option value="EMPLOYEE">Employee</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="FINANCE">Finance</option>
                                                <option value="HR_ADMIN">HR Admin</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" form="addEmployeeForm" disabled={isSubmitting} className="btn-primary">
                                    {isSubmitting ? 'Creating Account...' : 'Add Employee'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Joiner Credentials Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-8 text-center">
                                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
                                <p className="text-secondary text-sm mb-6">Give these credentials to the new joiner before triggering onboarding.</p>
                                
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-3 mb-6 text-left border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-secondary font-bold mb-1">Email Address</div>
                                        <div className="font-mono text-sm break-all">{createdUser?.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-secondary font-bold mb-1">Temporary Password</div>
                                        <div className="font-mono text-sm bg-accent/10 px-2 py-1 rounded inline-block">{createdUser?.password}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        className="btn-secondary flex-center gap-2"
                                        onClick={() => {
                                            const text = `HEMS Login\nEmail: ${createdUser.email}\nPassword: ${createdUser.password}`;
                                            navigator.clipboard.writeText(text);
                                            alert('Credentials copied to clipboard!');
                                        }}
                                    >
                                        Copy Details
                                    </button>
                                    <button 
                                        className="btn-primary"
                                        onClick={async () => {
                                            try {
                                                await api.post(`/onboarding/trigger/${createdUser.id}`);
                                                alert('Onboarding Triggered successfully!');
                                                setShowSuccessModal(false);
                                                fetchEmployees();
                                            } catch (err) {
                                                alert('Failed: ' + (err.response?.data?.error || err.message));
                                            }
                                        }}
                                    >
                                        Trigger Onboarding
                                    </button>
                                </div>
                                
                                <button 
                                    className="w-full mt-4 text-secondary text-sm hover:underline"
                                    onClick={() => setShowSuccessModal(false)}
                                >
                                    Close & Do it Later
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Directory;
