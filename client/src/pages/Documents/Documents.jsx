import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, File, UploadCloud, Search, MoreVertical, FileText, Download, Trash2, XCircle, Eye, ArrowLeft, Users, ChevronRight, User } from 'lucide-react';
import api from '../../api/axios';
import DocumentPreview from '../../components/DocumentPreview/DocumentPreview';
import './Documents.css';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    // Preview state
    const [previewFile, setPreviewFile] = useState({ url: '', name: '', open: false });

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        file: null,
        title: '',
        type: 'OTHER'
    });

    // Auth Check
    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isManager = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);

    useEffect(() => {
        if (isManager) {
            fetchEmployees();
        } else {
            fetchDocuments();
        }
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data.data);
        } catch (err) {
            console.error('Failed to fetch employees', err);
        }
    };

    const fetchDocuments = async (employeeId = null) => {
        try {
            setIsLoading(true);
            const targetId = employeeId || user.id;
            const res = await api.get(`/documents/${targetId}`);
            setDocuments(res.data.data);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmployeeClick = (emp) => {
        setSelectedEmployee(emp);
        fetchDocuments(emp._id);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (file.size > 10 * 1024 * 1024) {
            alert("File size exceeds 10MB limit.");
            return;
        }

        setUploadForm({
            ...uploadForm,
            file: file,
            title: file.name.split('.')[0] // Default title to filename without extension
        });
        setShowUploadModal(true);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return;

        const formData = new FormData();
        formData.append('file', uploadForm.file);
        formData.append('documentType', uploadForm.type);
        formData.append('title', uploadForm.title);
        
        // If admin is uploading for a specific employee
        if (isManager && selectedEmployee) {
            formData.append('userId', selectedEmployee._id);
        }

        setIsLoading(true);
        try {
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Document uploaded successfully!');
            setShowUploadModal(false);
            setUploadForm({ file: null, title: '', type: 'OTHER' });
            fetchDocuments(isManager && selectedEmployee ? selectedEmployee._id : user.id);
        } catch (err) {
            console.error('Upload error', err);
            alert('Failed to upload document: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;

        try {
            await api.delete(`/documents/${id}`);
            setDocuments(documents.filter(doc => doc._id !== id));
        } catch (err) {
            console.error('Delete error', err);
            alert('Failed to delete document: ' + (err.response?.data?.error || err.message));
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getFileExtension = (filename) => {
        return filename.split('.').pop().toUpperCase();
    };

    // Helper for backend served files vs external
    const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.split('/api/v1')[0] : 'http://localhost:5000';
        return `${backendBase}/${url.replace(/\\/g, '/')}`;
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            className="documents-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="directory-header">
                <div className="flex items-center gap-4">
                    {isManager && selectedEmployee && (
                        <button className="icon-btn-small" onClick={() => setSelectedEmployee(null)}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="page-title">
                            {isManager 
                                ? (selectedEmployee ? `${selectedEmployee.firstName}'s Vault` : 'Employee Document Center') 
                                : 'My Document Vault'}
                        </h1>
                        <p className="page-subtitle">
                            {isManager && !selectedEmployee 
                                ? 'Select an employee to manage their professional document repository.' 
                                : 'Secure storage for identification, certifications, and internal records.'}
                        </p>
                    </div>
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />

                {(!isManager || selectedEmployee) && (
                    <button className="btn-primary" onClick={triggerFileInput} disabled={isLoading}>
                        <UploadCloud size={18} /> {isLoading ? 'Uploading...' : 'Upload Document'}
                    </button>
                )}
            </div>

            <div className="documents-toolbar card">
                <div className="toolbar-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={isManager && !selectedEmployee ? "Search employees..." : "Search files..."}
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isManager && !selectedEmployee ? (
                <div className="employee-doc-grid mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredEmployees.map((emp) => (
                            <motion.div 
                                key={emp._id}
                                className="card employee-doc-card interactive p-6"
                                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                onClick={() => handleEmployeeClick(emp)}
                                layout
                            >
                                <div className="flex items-center gap-4">
                                    {emp.profilePicture ? (
                                        <img 
                                            src={getFullUrl(emp.profilePicture)} 
                                            alt={emp.firstName} 
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-accent-light shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-accent-light text-accent-primary flex items-center justify-center font-black text-xl">
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-primary">{emp.firstName} {emp.lastName}</h3>
                                        <p className="text-xs text-secondary font-medium uppercase tracking-widest">{emp.designation || 'Team Member'}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-tertiary" />
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-tertiary">
                                        <Folder size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Open Repository</span>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-secondary">
                                        {emp.email}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <>
                    <h3 className="section-title mt-8 mb-4">Available Documents</h3>
                    <div className="card p-0 overflow-hidden shadow-xl border-none">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Uploaded Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.length > 0 ? filteredDocs.map(file => (
                                    <tr key={file._id}>
                                        <td>
                                            <div className="file-name-cell">
                                                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                                                    <FileText className="text-secondary" size={18} />
                                                </div>
                                                <button 
                                                    onClick={() => setPreviewFile({ url: file.fileUrl, name: file.title, open: true })}
                                                    className="font-bold text-primary hover:text-accent-primary transition-colors"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                                >
                                                    {file.title}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className="file-type-text" style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    {file.documentType?.replace('_', ' ')}
                                                </span>
                                                <span className="file-badge" style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>{getFileExtension(file.title)}</span>
                                            </div>
                                        </td>
                                        <td><span className="text-secondary font-medium">{formatDate(file.createdAt)}</span></td>
                                        <td>
                                            <div className="file-actions">
                                                <button 
                                                    onClick={() => setPreviewFile({ url: file.fileUrl, name: file.title, open: true })}
                                                    className="icon-btn-small" 
                                                    title="View Document"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <a href={file.fileUrl} download className="icon-btn-small" title="Download">
                                                    <Download size={16} />
                                                </a>
                                                <button className="icon-btn-small text-danger" title="Delete" onClick={() => handleDelete(file._id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-20">
                                            <div className="flex flex-col items-center">
                                                <File size={48} className="text-gray-200 mb-4" />
                                                <p className="text-secondary font-medium italic">No documents found in this repository.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="upload-dropzone mt-8 border-dashed border-2 border-gray-200 rounded-3xl p-10 bg-gray-50/50 hover:bg-accent-light/20 hover:border-accent-primary/30 transition-all text-center" onClick={triggerFileInput} style={{ cursor: 'pointer' }}>
                        <UploadCloud size={48} className="text-tertiary mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-primary">Drop files here or click to browse</h3>
                        <p className="text-secondary text-sm mt-2">(Max file size: 10MB - PDFs, Word, & Images only)</p>
                    </div>
                </>
            )}

            <DocumentPreview 
                isOpen={previewFile.open}
                onClose={() => setPreviewFile({ ...previewFile, open: false })}
                fileUrl={previewFile.url}
                fileName={previewFile.name}
            />

            {/* Upload Document Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Upload to {selectedEmployee ? selectedEmployee.firstName : 'My Vault'}</h3>
                                <button onClick={() => setShowUploadModal(false)}><XCircle size={20} /></button>
                            </div>
                            <form onSubmit={handleUploadSubmit}>
                                <div className="p-6 space-y-4">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Document Name/Title</label>
                                        <input 
                                            type="text" 
                                            className="input-field mt-1"
                                            required
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                                            placeholder="e.g. Identity Proof"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Document Category</label>
                                        <select 
                                            className="input-field mt-1"
                                            required
                                            value={uploadForm.type}
                                            onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                                        >
                                            <option value="ID_PROOF">Identity Proof</option>
                                            <option value="PASSPORT_PHOTO">Passport Photo</option>
                                            <option value="OFFER_LETTER">Offer Letter</option>
                                            <option value="EXPERIENCE_LETTER">Experience Letter</option>
                                            <option value="PAYSLIP">Payslip</option>
                                            <option value="CERTIFICATE">Certificate</option>
                                            <option value="RESUME">Resume/CV</option>
                                            <option value="POLICY">Policy Document</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="p-4 bg-accent-light/30 rounded-2xl flex items-center gap-4 border border-accent-light">
                                        <div className="bg-white p-2 rounded-xl shadow-sm">
                                            <FileText size={24} className="text-accent-primary" />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className="text-sm font-bold truncate text-primary">{uploadForm.file?.name}</p>
                                            <p className="text-[10px] text-accent-primary font-bold uppercase tracking-widest">Ready for secure upload</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={isLoading}>
                                        {isLoading ? 'Processing...' : 'Confirm Upload'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Documents;
