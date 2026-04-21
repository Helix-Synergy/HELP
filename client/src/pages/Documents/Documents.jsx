import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, File, UploadCloud, Search, MoreVertical, FileText, Download, Trash2, XCircle, Eye } from 'lucide-react';
import api from '../../api/axios';
import DocumentPreview from '../../components/DocumentPreview/DocumentPreview';
import './Documents.css';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
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
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            if (isManager) {
                const res = await api.get('/documents/all');
                setDocuments(res.data.data);
            } else {
                const res = await api.get(`/documents/${user.id}`);
                setDocuments(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch documents', err);
        }
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

        setIsLoading(true);
        try {
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Document uploaded successfully!');
            setShowUploadModal(false);
            setUploadForm({ file: null, title: '', type: 'OTHER' });
            fetchDocuments();
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
                <div>
                    <h1 className="page-title">{isManager ? 'Company Documents' : 'My Documents'}</h1>
                    <p className="page-subtitle">Centralized secure storage for all employee and company documents.</p>
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />

                <button className="btn-primary" onClick={triggerFileInput} disabled={isLoading}>
                    <UploadCloud size={18} /> {isLoading ? 'Uploading...' : 'Upload Document'}
                </button>
            </div>

            <div className="documents-toolbar card">
                <div className="toolbar-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <h3 className="section-title mt-4">All Files</h3>
            <div className="card p-0">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            {isManager && <th>Owner</th>}
                            <th>Uploaded Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocs.length > 0 ? filteredDocs.map(file => (
                            <tr key={file._id}>
                                <td>
                                    <div className="file-name-cell">
                                        <FileText className="text-secondary mr-2" size={18} />
                                        <button 
                                            onClick={() => setPreviewFile({ url: file.fileUrl, name: file.title, open: true })}
                                            style={{ color: 'inherit', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                        >
                                            {file.title}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className="file-type-text" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                            {file.documentType?.replace('_', ' ')}
                                        </span>
                                        <span className="file-badge" style={{ alignSelf: 'flex-start' }}>{getFileExtension(file.title)}</span>
                                    </div>
                                </td>
                                {isManager && (
                                    <td>{file.user ? `${file.user.firstName} ${file.user.lastName}` : 'System'}</td>
                                )}
                                <td><span className="text-secondary">{formatDate(file.createdAt)}</span></td>
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
                                <td colSpan={isManager ? 5 : 4} className="text-center py-4 text-muted">No documents found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="upload-dropzone mt-4" onClick={triggerFileInput} style={{ cursor: 'pointer' }}>
                <UploadCloud size={48} className="text-tertiary mb-2" />
                <h3>Click here to Browse your computer</h3>
                <p className="text-secondary">(Max file size: 10MB - PDFs & Images only)</p>
            </div>

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
                                <h3 className="font-bold text-lg">Upload New Document</h3>
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
                                            placeholder="e.g. My ID Card"
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
                                    <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                                        <FileText size={20} className="text-blue-500" />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium truncate">{uploadForm.file?.name}</p>
                                            <p className="text-[10px] text-blue-400">Ready to upload</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 flex justify-end gap-3">
                                    <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={isLoading}>
                                        {isLoading ? 'Uploading...' : 'Confirm Upload'}
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
