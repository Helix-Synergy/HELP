import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Grid as GridIcon, List as ListIcon, MoreVertical, Mail, Phone, X } from 'lucide-react';
import api from '../../api/axios';
import './Directory.css';

const Directory = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE',
        designation: '', status: 'ACTIVE',
        phone: '', address: '', dateOfBirth: '', gender: 'Male', maritalStatus: 'Unmarried',
        resignationDate: '', resignationReason: ''
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
                initials: `${u.firstName[0]}${u.lastName[0]}`,
                raw: u
            }));
            setEmployees(formatted);
        } catch (err) {
            console.error('Failed to fetch employees', err);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/users', formData);
            alert('Employee Added Successfully');
            setShowAddModal(false);
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
        setEditingEmployeeId(emp.id);
        const raw = emp.raw;
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
            resignationDate: raw.resignationDate ? raw.resignationDate.split('T')[0] : '',
            resignationReason: raw.resignationReason || ''
        });
        setShowEditModal(true);
        setOpenMenuId(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/users/${editingEmployeeId}`, formData);
            alert('Employee Updated Successfully');
            setShowEditModal(false);
            fetchEmployees();
        } catch (err) {
            alert('Error updating employee: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSubmitting(false);
        }
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
                                className="card emp-card"
                                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
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
                                    <a href={`mailto:${emp.email}`} className="contact-btn"><Mail size={16} /> Email</a>
                                    <a href={emp.phone !== 'N/A' ? `tel:${emp.phone}` : '#'} className={`contact-btn ${emp.phone === 'N/A' ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                                    <tr key={emp.id}>
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
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Account Info</h3>
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
                                            <label>Temporary Password</label>
                                            <input type="password" required className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6">Personal Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group flex-1">
                                            <label>Phone Number</label>
                                            <input type="tel" className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Date of Birth</label>
                                            <input type="date" className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Gender</label>
                                            <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Marital Status</label>
                                            <select className="input-field" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                                                <option>Unmarried</option><option>Married</option>
                                            </select>
                                        </div>
                                        <div className="form-group col-span-2">
                                            <label>Full Address</label>
                                            <textarea className="input-field min-h-[80px]" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6">Work Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group flex-1 cursor-pointer">
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

            {/* Edit Employee Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold">Edit Employee Details</h2>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setShowEditModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="editEmployeeForm" onSubmit={handleEditSubmit} className="space-y-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Account Info</h3>
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
                                            <label>Designation</label>
                                            <input type="text" className="input-field" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6">Personal Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group flex-1">
                                            <label>Phone Number</label>
                                            <input type="tel" className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Date of Birth</label>
                                            <input type="date" className="input-field" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Gender</label>
                                            <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Marital Status</label>
                                            <select className="input-field" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                                                <option>Unmarried</option><option>Married</option>
                                            </select>
                                        </div>
                                        <div className="form-group col-span-2">
                                            <label>Full Address</label>
                                            <textarea className="input-field min-h-[80px]" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-6">Work Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>System Role</label>
                                            <select className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                                <option value="EMPLOYEE">Employee</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="FINANCE">Finance</option>
                                                <option value="HR_ADMIN">HR Admin</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Status</label>
                                            <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Resigned / Inactive</option>
                                                <option value="PROBATION">Probation</option>
                                                <option value="NOTICE_PERIOD">Notice Period</option>
                                            </select>
                                        </div>
                                    </div>

                                    {formData.status === 'INACTIVE' && (
                                        <>
                                            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mt-6">Resignation Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group flex-1">
                                                    <label>Resignation Date</label>
                                                    <input type="date" className="input-field border-red-200" value={formData.resignationDate} onChange={e => setFormData({ ...formData, resignationDate: e.target.value })} />
                                                </div>
                                                <div className="form-group col-span-2">
                                                    <label>Reason for Resignation</label>
                                                    <textarea className="input-field border-red-200 min-h-[80px]" value={formData.resignationReason} onChange={e => setFormData({ ...formData, resignationReason: e.target.value })} placeholder="State the reason for resignation..."></textarea>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" form="editEmployeeForm" disabled={isSubmitting} className="btn-primary">
                                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
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
