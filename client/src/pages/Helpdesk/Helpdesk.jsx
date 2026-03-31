import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadphonesIcon, MessageSquare, Plus, AlertCircle, Clock, CheckCircle, ChevronRight, User, X } from 'lucide-react';
import api from '../../api/axios';
import './Helpdesk.css';

const Helpdesk = () => {
    const [tickets, setTickets] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
    const [staff, setStaff] = useState([]);

    // Modals
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);

    // Form data
    const [newTicket, setNewTicket] = useState({ category: 'IT_SUPPORT', priority: 'MEDIUM', subject: '', description: '' });
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        setUser(currentUser);
        setIsAdmin(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(currentUser?.role));

        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const myRes = await api.get('/helpdesk/me');
            setTickets(myRes.data.data);

            const userStr = localStorage.getItem('hems_user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const isUserAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(currentUser?.role);

            if (isUserAdmin || isAdmin) {
                const allRes = await api.get('/helpdesk/all');
                setAllTickets(allRes.data.data);
                
                // Fetch staff for assignment
                const staffRes = await api.get('/users');
                // Show all employees as potential assignees
                setStaff(staffRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching tickets', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            await api.post('/helpdesk', newTicket);
            setShowNewTicketModal(false);
            setNewTicket({ category: 'IT_SUPPORT', priority: 'MEDIUM', subject: '', description: '' });
            fetchTickets();
            alert('Ticket created successfully');
        } catch (error) {
            alert('Failed to create ticket');
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            const res = await api.put(`/helpdesk/${activeTicket._id}`, { text: replyText });
            setActiveTicket(res.data.data);
            setReplyText('');
            fetchTickets(); // Refresh lists in background
        } catch (error) {
            alert('Failed to send reply');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await api.put(`/helpdesk/${activeTicket._id}`, { status: newStatus });
            setActiveTicket(res.data.data);
            fetchTickets();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleAssign = async (userId) => {
        try {
            const res = await api.put(`/helpdesk/${activeTicket._id}`, { assignedTo: userId });
            setActiveTicket(res.data.data);
            fetchTickets();
            alert('Ticket assigned successfully');
        } catch (error) {
            alert('Failed to assign ticket');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'OPEN': return <AlertCircle size={16} className="text-warning-color" />;
            case 'IN_PROGRESS': return <Clock size={16} className="text-accent-primary" />;
            case 'RESOLVED': return <CheckCircle size={16} className="text-success" />;
            case 'CLOSED': return <CheckCircle size={16} className="text-gray-400" />;
            default: return null;
        }
    };

    // Render Ticket List Item
    const TicketRow = ({ ticket, onClick }) => (
        <div
            className={`ticket-row ${activeTicket?._id === ticket._id ? 'active' : ''}`}
            onClick={() => onClick(ticket)}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{ticket.subject}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">{getStatusIcon(ticket.status)} {ticket.status.replace('_', ' ')}</span>
                    {ticket.assignedTo?._id === user?.id && (
                        <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase border border-amber-200">Assigned To Me</span>
                    )}
                    {viewMode === 'all' && (
                        <>
                            <span>•</span>
                            <span className="font-medium text-blue-600">{ticket.requesterId?.firstName} {ticket.requesterId?.lastName}</span>
                        </>
                    )}
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">{ticket.category.replace('_', ' ')}</span>
                </div>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
        </div>
    );

    return (
        <motion.div className="h-[calc(100vh-80px)] flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 flex-shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight mb-1">Support Helpdesk</h1>
                    <p className="text-gray-500 font-medium tracking-wide">Submit requests and track resolution status in real-time.</p>
                </div>
                <button onClick={() => setShowNewTicketModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0">
                    <Plus size={20} /> <span className="tracking-wide">New Ticket</span>
                </button>
            </div>

            <div className="flex-1 min-h-0 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 flex overflow-hidden ring-1 ring-black/5">

                {/* Left Panel: Ticket List */}
                <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                    <div className="p-5 border-b border-gray-100 flex space-x-3 bg-white/50 backdrop-blur-sm">
                        <button 
                            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${viewMode === 'my' ? 'bg-white border border-gray-200 font-bold text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-100'}`}
                            onClick={() => { setViewMode('my'); setActiveTicket(null); }}
                        >
                            My Tickets
                        </button>
                        {isAdmin && (
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${viewMode === 'all' ? 'bg-white border border-gray-200 font-bold text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-100'}`}
                                onClick={() => { setViewMode('all'); setActiveTicket(null); }}
                            >
                                All Queue
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div></div>
                        ) : (viewMode === 'my' ? tickets : allTickets).length === 0 ? (
                            <div className="text-center p-10 space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <HeadphonesIcon size={28} className="text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">No tickets found in this view.</p>
                            </div>
                        ) : (
                            (viewMode === 'my' ? tickets : allTickets).map(t => <TicketRow key={t._id} ticket={t} onClick={(ticket) => setActiveTicket(ticket)} />)
                        )}
                    </div>
                </div>

                {/* Right Panel: Ticket Detail & Chat */}
                <div className="w-2/3 flex flex-col relative bg-[#F8FAFC]">
                    {activeTicket ? (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white/80 backdrop-blur-md z-10 shadow-sm relative">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{activeTicket.subject}</h2>
                                        <span className={`text-xs px-2.5 py-1 rounded-md font-bold border tracking-wide uppercase shadow-sm ${getPriorityColor(activeTicket.priority)}`}>
                                            {activeTicket.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">#{activeTicket._id.toString().substring(18, 24).toUpperCase()}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1.5">{getStatusIcon(activeTicket.status)} <strong className="text-gray-700">{activeTicket.status.replace('_', ' ')}</strong></span>
                                        <span>•</span>
                                        <span className="text-gray-600">{activeTicket.category.replace('_', ' ')}</span>
                                        {activeTicket.assignedTo && (
                                            <>
                                                <span>•</span>
                                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                                                    <User size={12} /> {activeTicket.assignedTo.firstName} {activeTicket.assignedTo.lastName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 mr-4 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm">
                                            <span className="text-xs font-bold text-gray-500 ml-1">ASSIGN TO:</span>
                                            <select 
                                                className="text-xs font-semibold bg-transparent border-none focus:ring-0 cursor-pointer text-blue-600"
                                                value={activeTicket.assignedTo?._id || ''}
                                                onChange={(e) => handleAssign(e.target.value)}
                                            >
                                                <option value="">Unassigned</option>
                                                {staff.map(u => (
                                                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role.replace('_', ' ')})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {/* Mark Resolved - allowed for Admin OR Assigned Representative */}
                                    {(activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED') && (isAdmin || activeTicket.assignedTo?._id === user?.id) && (
                                        <button onClick={() => handleStatusChange('RESOLVED')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-2 px-4 rounded-lg shadow-sm hover:shadow transition-colors flex items-center gap-2">
                                            <CheckCircle size={16} /> Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Conversation Thread */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 relative">
                                {/* Original Post */}
                                <div className="chat-bubble flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                                        {activeTicket.requesterId?.firstName?.[0] || <User size={20} />}
                                        {activeTicket.requesterId?.lastName?.[0] || ''}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="font-semibold text-gray-900">
                                                {activeTicket.requesterId?._id === user?.id ? 'You' : `${activeTicket.requesterId?.firstName} ${activeTicket.requesterId?.lastName}`} (Original Request)
                                            </span>
                                            <span className="text-xs text-gray-500">{new Date(activeTicket.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm border border-gray-100 text-gray-700 whitespace-pre-wrap">
                                            {activeTicket.description}
                                        </div>
                                    </div>
                                </div>

                                {/* Comments */}
                                {activeTicket.comments.map((comment, idx) => {
                                    const isMe = comment.userId?._id === user?.id || comment.userId === user?.id;
                                    return (
                                        <div key={idx} className={`chat-bubble flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isMe ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'}`}>
                                                {isMe ? <User size={20} /> : <HeadphonesIcon size={20} />}
                                            </div>
                                            <div className={`flex-1 ${isMe ? 'flex flex-col items-end' : ''}`}>
                                                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="font-semibold text-gray-900">
                                                        {isMe ? 'You' : `${comment.userId?.firstName || 'Support'} ${comment.userId?.lastName || 'Agent'}`}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className={`p-4 rounded-xl shadow-sm border max-w-[85%] whitespace-pre-wrap ${isMe ? 'bg-blue-600 text-white border-blue-700 rounded-tr-none' : 'bg-white text-gray-700 border-gray-100 rounded-tl-none'}`}>
                                                    {comment.text}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Input */}
                            {(activeTicket.status !== 'CLOSED') && (
                                <div className="p-5 bg-white border-t border-gray-100 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                                    <form onSubmit={handleReply} className="flex gap-3 max-w-4xl mx-auto">
                                        <textarea
                                            className="flex-1 resize-none border border-gray-200 bg-gray-50/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                                            rows="2"
                                            placeholder="Write your reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply(e);
                                                }
                                            }}
                                        ></textarea>
                                        <button type="submit" disabled={!replyText.trim()} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-8 font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 transform active:scale-95">
                                            <MessageSquare size={18} /> <span className="hidden md:inline">Send</span>
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-gray-400 p-8 text-center animate-pulse">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner pointer-events-none">
                                <MessageSquare size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">How can we help?</h3>
                            <p className="max-w-md mx-auto text-gray-500 font-medium">Select a ticket from the left panel to securely communicate with HR or IT support staff.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showNewTicketModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 ring-1 ring-black/5"
                        >
                            <div className="flex justify-between items-center p-6 bg-gray-50/50 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="text-blue-500" /> Submit New Ticket</h2>
                                <button onClick={() => setShowNewTicketModal(false)} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-1 transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newTicket.category}
                                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                        >
                                            <option value="IT_SUPPORT">IT Support</option>
                                            <option value="HR_QUERY">HR Query</option>
                                            <option value="PAYROLL_ISSUE">Payroll Issue</option>
                                            <option value="FACILITY">Facility / Building</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newTicket.priority}
                                            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Cannot access VPN"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        required
                                        rows="4"
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        placeholder="Please provide details about your issue..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8 bg-gray-50 -mx-6 -mb-6 p-6">
                                    <button type="button" onClick={() => setShowNewTicketModal(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                                        <Plus size={18} /> Submit Ticket
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

export default Helpdesk;
