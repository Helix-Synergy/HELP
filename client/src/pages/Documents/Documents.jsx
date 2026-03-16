import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, File, UploadCloud, Search, MoreVertical, FileText, Download, Trash2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import './Documents.css';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (file.size > 10 * 1024 * 1024) {
            alert("File size exceeds 10MB limit.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'POLICY'); // Can be expanded to dropdown
        formData.append('title', file.name);

        setIsLoading(true);
        try {
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Document uploaded successfully!');
            fetchDocuments(); // Refresh tracking
        } catch (err) {
            console.error('Upload error', err);
            alert('Failed to upload document: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // clear input
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
                    onChange={handleFileUpload}
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
                                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {file.title}
                                        </a>
                                    </div>
                                </td>
                                <td><span className="file-badge">{getFileExtension(file.title)}</span></td>
                                {isManager && (
                                    <td>{file.user ? `${file.user.firstName} ${file.user.lastName}` : 'System'}</td>
                                )}
                                <td><span className="text-secondary">{formatDate(file.createdAt)}</span></td>
                                <td>
                                    <div className="file-actions">
                                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="icon-btn-small" title="Download/View">
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

        </motion.div>
    );
};

export default Documents;
