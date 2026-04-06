import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';

const DocumentPreview = ({ isOpen, onClose, fileUrl, fileName }) => {
    if (!isOpen) return null;

    // Helper for backend served files vs external
    const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.split('/api/v1')[0] : 'http://localhost:5000';
        return `${backendBase}/${url.replace(/\\/g, '/')}`;
    };

    const fullUrl = getFullUrl(fileUrl);
    
    // Priority check for PDFs to avoid Cloudinary 'image/upload' URL false positives
    const isPdf = fullUrl && (
        fullUrl.toLowerCase().endsWith('.pdf') || 
        fullUrl.toLowerCase().includes('.pdf?')
    );

    const isImage = !isPdf && fullUrl && (
        fullUrl.toLowerCase().endsWith('.jpg') || 
        fullUrl.toLowerCase().endsWith('.jpeg') || 
        fullUrl.toLowerCase().endsWith('.png') || 
        fullUrl.toLowerCase().endsWith('.gif') ||
        fullUrl.toLowerCase().endsWith('.webp') ||
        fullUrl.toLowerCase().includes('image/')
    );

    // PDF viewer - Use Google Docs Viewer for better in-browser experience across environments
    const pdfViewerUrl = isPdf ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true` : fullUrl;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl w-full h-full max-w-6xl overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 text-accent rounded-lg">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary truncate max-w-[200px] md:max-w-md">{fileName || 'Document Preview'}</h3>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                                    {isImage ? 'Image File' : isPdf ? 'PDF Document' : 'File Preview'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <a 
                                href={fullUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-2 hover:bg-gray-200 rounded-full text-secondary transition-colors"
                                title="Open in New Tab"
                            >
                                <ExternalLink size={20} />
                            </a>
                            <a 
                                href={fullUrl} 
                                download 
                                className="p-2 hover:bg-gray-200 rounded-full text-secondary transition-colors"
                                title="Download"
                            >
                                <Download size={20} />
                            </a>
                            <div className="w-px h-6 bg-gray-200 mx-2"></div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-danger/10 hover:text-danger rounded-full text-secondary transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
                        {isImage ? (
                            <img 
                                src={fullUrl} 
                                alt={fileName} 
                                className="max-w-full max-h-full object-contain rounded shadow-lg bg-white"
                            />
                        ) : isPdf ? (
                            /* Use Google Docs Viewer for maximum cross-origin reliability */
                            <iframe 
                                src={pdfViewerUrl} 
                                title={fileName}
                                className="w-full h-full rounded border-0 shadow-lg bg-white"
                            >
                                <p>Your browser does not support iframes. <a href={fullUrl}>Download the PDF</a> instead.</p>
                            </iframe>
                        ) : (
                            <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md">
                                <AlertCircle size={48} className="text-warning mx-auto mb-4" />
                                <h3 className="text-primary font-bold mb-2">Preview Not Available</h3>
                                <p className="text-secondary text-sm mb-6">This file type cannot be previewed directly in the browser.</p>
                                <div className="flex gap-3 justify-center">
                                    <a href={fullUrl} download className="btn-primary flex items-center gap-2">
                                        <Download size={18} /> Download to View
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DocumentPreview;
