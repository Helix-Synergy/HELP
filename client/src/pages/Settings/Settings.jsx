import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Building, Shield, Key, Save, UploadCloud } from 'lucide-react';
import api from '../../api/axios';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [editForm, setEditForm] = useState({
        firstName: '', lastName: '', phone: '', address: '', dateOfBirth: '', gender: 'Male', maritalStatus: 'Unmarried'
    });

    const tabs = [
        { id: 'profile', icon: <User size={18} />, label: 'My Profile' },
        { id: 'company', icon: <Building size={18} />, label: 'Company Info' },
        { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
        { id: 'security', icon: <Shield size={18} />, label: 'Security & Roles' },
    ];

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/users/me');
                setUser(res.data.data);
                setEditForm({
                    firstName: res.data.data.firstName || '',
                    lastName: res.data.data.lastName || '',
                    phone: res.data.data.contactDetails?.phone || '',
                    address: res.data.data.contactDetails?.address || '',
                    dateOfBirth: res.data.data.dateOfBirth ? res.data.data.dateOfBirth.split('T')[0] : '',
                    gender: res.data.data.gender || 'Male',
                    maritalStatus: res.data.data.maritalStatus || 'Unmarried'
                });
                localStorage.setItem('hems_user', JSON.stringify(res.data.data));
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const res = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(res.data.data);
            localStorage.setItem('hems_user', JSON.stringify(res.data.data));
            window.dispatchEvent(new Event('userUpdated'));
            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload picture. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (activeTab === 'profile') {
                const res = await api.put('/users/me', {
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    phone: editForm.phone,
                    address: editForm.address,
                    dateOfBirth: editForm.dateOfBirth,
                    gender: editForm.gender,
                    maritalStatus: editForm.maritalStatus
                });
                setUser(res.data.data);
                localStorage.setItem('hems_user', JSON.stringify(res.data.data));
                window.dispatchEvent(new Event('userUpdated'));
                alert('Profile updated successfully!');
            } else {
                alert('Preferences saved successfully!'); // Mock save for other tabs
            }
        } catch (error) {
            console.error('Save failed', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            className="settings-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Configure your account preferences and system parameters.</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={isSaving || !user}>
                    {isSaving ? <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="settings-container card p-0">
                <div className="settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="settings-panel">
                            <h3 className="panel-title">Personal Information</h3>

                            {user ? (
                                <>
                                    <div className="profile-edit-header">
                                        <div className="relative group">
                                            {user.profilePicture && !user.profilePicture.includes('ui-avatars') ? (
                                                <img src={user.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md border-4 border-white">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="avatar-actions">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                {isUploading ? <div className="spinner w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div> : <UploadCloud size={16} />}
                                                {isUploading ? 'Uploading...' : 'Upload New Picture'}
                                            </button>
                                            <button className="text-btn text-danger ml-4">Remove</button>
                                        </div>
                                    </div>

                                    <div className="form-row mt-6">
                                        <div className="form-group flex-1">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="form-group flex-1">
                                            <label>Email Address</label>
                                            <input type="email" className="input-field" defaultValue={user.email} disabled />
                                            <small className="text-secondary mt-1 block">Email changes require admin approval.</small>
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>System Role</label>
                                            <input type="text" className="input-field capitalize" defaultValue={user.role.toLowerCase().replace('_', ' ')} disabled />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="form-group flex-1">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                className="input-field"
                                                placeholder="+1 (555) 000-0000"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>Date of Birth</label>
                                            <input type="date" className="input-field" value={editForm.dateOfBirth} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Gender</label>
                                            <select className="input-field" value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })}>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group flex-1 cursor-pointer">
                                            <label>Marital Status</label>
                                            <select className="input-field" value={editForm.maritalStatus} onChange={e => setEditForm({ ...editForm, maritalStatus: e.target.value })}>
                                                <option>Unmarried</option><option>Married</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group mt-4 mb-6">
                                        <label>Full Address</label>
                                        <textarea className="input-field min-h-[80px]" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}></textarea>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div></div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="settings-panel">
                            <h3 className="panel-title">Notification Preferences</h3>

                            <div className="pref-group">
                                <h4>General Notifications</h4>
                                <div className="pref-item">
                                    <div className="pref-info">
                                        <h5>Push Notifications</h5>
                                        <p>Receive notifications in the browser.</p>
                                    </div>
                                    <div className="toggle-switch active"></div>
                                </div>
                                <div className="pref-item">
                                    <div className="pref-info">
                                        <h5>Email Alerts</h5>
                                        <p>Receive daily summaries via email.</p>
                                    </div>
                                    <div className="toggle-switch"></div>
                                </div>
                            </div>

                            <div className="pref-group mt-4">
                                <h4>Workflows</h4>
                                <div className="pref-item">
                                    <div className="pref-info">
                                        <h5>Leave Approvals</h5>
                                        <p>Notify me when my leave is approved or rejected.</p>
                                    </div>
                                    <div className="toggle-switch active"></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(activeTab === 'company' || activeTab === 'security') && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="settings-panel flex-center" style={{ height: '400px' }}>
                            <div className="empty-state text-tertiary">
                                <Shield size={48} className="mb-4" />
                                <p>This section is restricted to Super Admins.</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Settings;
