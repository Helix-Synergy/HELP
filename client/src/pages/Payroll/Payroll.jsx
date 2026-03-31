import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Receipt, Download, Eye, CheckCircle, AlertCircle, 
    Calendar, Filter, FileText, ChevronRight, Calculator,
    TrendingUp, Coins, CreditCard, Landmark, Edit2, Check, X
} from 'lucide-react';
import api from '../../api/axios';
import logo from '../../assets/logo.jpg';
import './Payroll.css';

const Payroll = () => {
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem('hems_user');
        return u ? JSON.parse(u) : null;
    });
    
    const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'].includes(user?.role);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'my-payslips');
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [updatingPerf, setUpdatingPerf] = useState(null); // ID of user being updated
    
    // States for Admin
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 7);
    });
    const [payrollSummary, setPayrollSummary] = useState([]);
    const [attendanceSummary, setAttendanceSummary] = useState([]);
    const [overrides, setOverrides] = useState({});
    const [perfOverrides, setPerfOverrides] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    
    // States for Employee
    const [myPayslips, setMyPayslips] = useState([]);
    const [selectedSlip, setSelectedSlip] = useState(null);

    useEffect(() => {
        if (isAdmin && activeTab === 'admin') fetchAdminSummary();
        else fetchMyPayslips();
    }, [activeTab, selectedMonth]);

    const fetchAdminSummary = async () => {
        setLoading(true);
        try {
            // Fetch financial summary (already processed)
            const resSummary = await api.get(`/payroll/summary?month=${selectedMonth}`);
            setPayrollSummary(resSummary.data.data);

            // Fetch attendance summary (preview)
            const resAttendance = await api.get(`/payroll/attendance-summary?month=${selectedMonth}`);
            setAttendanceSummary(resAttendance.data.data);
        } catch (err) {
            console.error('Failed to fetch summary', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyPayslips = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payroll/payslips/me');
            setMyPayslips(res.data.data);
        } catch (err) {
            console.error('Failed to fetch payslips', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePerformance = async (userId, value) => {
        setUpdatingPerf(userId);
        try {
            await api.put(`/users/${userId}`, { performanceFactor: value });
            // Refresh summary to get updated data from backend
            fetchAdminSummary();
            setPerfOverrides(prev => {
                const updated = { ...prev };
                delete updated[userId]; // Remove from overrides since it's now saved to DB
                return updated;
            });
            setEditingId(null);
        } catch (err) {
            alert('Failed to update performance: ' + (err.response?.data?.error || err.message));
        } finally {
            setUpdatingPerf(null);
        }
    };

    const handleProcessPayroll = async () => {
        if (!window.confirm(`Process payroll for ${selectedMonth}? This will generate payslips for all active employees.`)) return;
        
        setProcessing(true);
        try {
            const res = await api.post('/payroll/process', { 
                month: selectedMonth,
                overrides: overrides,
                perfOverrides: perfOverrides
            });
            alert(res.data.message);
            setOverrides({}); 
            setPerfOverrides({});
            fetchAdminSummary();
        } catch (err) {
            alert(err.response?.data?.error || 'Processing failed');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const monthName = (mStr) => {
        if (!mStr) return '';
        const [y, m] = mStr.split('-');
        return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <motion.div 
            className="payroll-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Payroll Management</h1>
                    <p className="page-subtitle">Manage salary processing, slips, and financial records.</p>
                </div>
                {isAdmin && activeTab === 'admin' && (
                    <div className="flex items-center gap-3">
                        <div className="month-picker-container">
                            <input 
                                type="month" 
                                className="input-field py-2" 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)} 
                            />
                        </div>
                        <button 
                            className="btn-primary flex items-center gap-2" 
                            onClick={handleProcessPayroll}
                            disabled={processing}
                        >
                            {processing ? <div className="spinner-small"></div> : <Calculator size={18} />}
                            {processing ? 'Processing...' : 'Run Payroll'}
                        </button>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="tabs-container mb-6">
                    <button className={`tab-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Admin Dashboard</button>
                    <button className={`tab-item ${activeTab === 'my-payslips' ? 'active' : ''}`} onClick={() => setActiveTab('my-payslips')}>My Payslips</button>
                </div>
            )}

            {activeTab === 'admin' && isAdmin ? (
                <div className="admin-payroll-view">
                    <div className="stats-grid mb-8">
                        <div className="stat-card">
                            <div className="stat-icon bg-blue-100 text-blue-600"><Coins size={24} /></div>
                            <div className="stat-info">
                                <h3>Total Outflow</h3>
                                <p>{formatCurrency(payrollSummary.reduce((acc, p) => acc + p.netPay, 0))}</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon bg-green-100 text-green-600"><CheckCircle size={24} /></div>
                            <div className="stat-info">
                                <h3>Processed</h3>
                                <p>{payrollSummary.length} Employees</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon bg-purple-100 text-purple-600"><TrendingUp size={24} /></div>
                            <div className="stat-info">
                                <h3>Avg Net Pay</h3>
                                <p>{formatCurrency(payrollSummary.length ? payrollSummary.reduce((acc, p) => acc + p.netPay, 0) / payrollSummary.length : 0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-8">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Attendance Preview ({monthName(selectedMonth)})</h3>
                            <button 
                                className="btn-primary flex items-center gap-2" 
                                onClick={handleProcessPayroll}
                                disabled={processing || attendanceSummary.every(a => a.hasProcessed)}
                            >
                                {processing ? <div className="spinner-small"></div> : <Calculator size={18} />}
                                {processing ? 'Processing...' : 'Run Batch Payroll'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Total Days</th>
                                        <th>Present Days</th>
                                        <th>Performance %</th>
                                        <th>LOP Days</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-4">Loading preview...</td></tr>
                                    ) : attendanceSummary.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-4 text-secondary italic">No attendance data found for this month.</td></tr>
                                    ) : (
                                        attendanceSummary.map(a => {
                                            const isEditing = editingId === a.userId;
                                            const currentVal = overrides[a.userId] !== undefined ? overrides[a.userId] : a.presentDays;
                                            const hasOverride = overrides[a.userId] !== undefined;

                                            return (
                                                <tr key={a.userId}>
                                                    <td className="font-medium">{a.name}</td>
                                                    <td>{a.totalDays}</td>
                                                    <td>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="number" 
                                                                    className="input-field py-1 px-2 w-20 text-sm" 
                                                                    value={editingValue}
                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                />
                                                                <button 
                                                                    className="text-green-600 hover:text-green-800"
                                                                    onClick={() => {
                                                                        setOverrides({ ...overrides, [a.userId]: editingValue });
                                                                        setEditingId(null);
                                                                    }}
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button 
                                                                    className="text-red-500 hover:text-red-700"
                                                                    onClick={() => setEditingId(null)}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group">
                                                                <span className={`font-bold ${hasOverride ? 'text-blue-600' : 'text-green-600'}`}>
                                                                    {currentVal}
                                                                </span>
                                                                {!a.hasProcessed && (
                                                                    <button 
                                                                        className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => {
                                                                            setEditingId(a.userId);
                                                                            setEditingValue(currentVal);
                                                                        }}
                                                                    >
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editingId === `${a.userId}_perf` ? (
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="number" 
                                                                    className="input-field py-1 px-2 w-20 text-sm" 
                                                                    value={editingValue}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                />
                                                                <button 
                                                                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                                                    disabled={updatingPerf === a.userId}
                                                                    onClick={() => handleUpdatePerformance(a.userId, editingValue)}
                                                                >
                                                                    {updatingPerf === a.userId ? '...' : <Check size={16} />}
                                                                </button>
                                                                <button 
                                                                    className="text-red-500 hover:text-red-700"
                                                                    onClick={() => setEditingId(null)}
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group">
                                                                <span className={`font-bold ${perfOverrides[a.userId] !== undefined ? 'text-purple-600' : 'text-gray-600'}`}>
                                                                    {(perfOverrides[a.userId] !== undefined ? perfOverrides[a.userId] : (a.performanceFactor !== undefined && a.performanceFactor !== null ? a.performanceFactor : 100))}%
                                                                </span>
                                                                <button 
                                                                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => {
                                                                        setEditingId(`${a.userId}_perf`);
                                                                        const baseVal = perfOverrides[a.userId] !== undefined ? perfOverrides[a.userId] : a.performanceFactor;
                                                                        setEditingValue(baseVal !== undefined && baseVal !== null ? baseVal : 100);
                                                                    }}
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={a.lopDays > 0 ? "text-red-500 font-bold" : "text-gray-400"}>
                                                        {hasOverride ? Math.max(0, a.totalDays - parseFloat(editingValue || currentVal) - 8) : a.lopDays}
                                                    </td>
                                                    <td>
                                                        {a.hasProcessed ? 
                                                            <span className="status-badge processed">Processed</span> : 
                                                            <span className="status-badge draft font-mono text-[10px]">PENDING</span>
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="stat-header mb-4 flex items-center gap-2 text-secondary">
                        <FileText size={18} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Processed Payslips</h3>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Employee ID</th>
                                    <th>Earnings</th>
                                    <th>Deductions</th>
                                    <th>Net Pay</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-8">Loading...</td></tr>
                                ) : payrollSummary.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-8">No records found for this month. Run payroll to generate.</td></tr>
                                ) : (
                                    payrollSummary.map(p => (
                                        <tr key={p._id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                                                        {p.userId?.firstName[0]}{p.userId?.lastName[0]}
                                                    </div>
                                                    <span className="font-medium">{p.userId?.firstName} {p.userId?.lastName}</span>
                                                </div>
                                            </td>
                                            <td>{p.userId?.employeeId}</td>
                                            <td>{formatCurrency(p.totalEarnings)}</td>
                                            <td className="text-red-500">-{formatCurrency(p.totalDeductions)}</td>
                                            <td className="font-bold text-green-600">{formatCurrency(p.netPay)}</td>
                                            <td><span className="status-badge paid">PAID</span></td>
                                            <td>
                                                <button className="icon-btn text-accent" onClick={() => setSelectedSlip(p)}><Eye size={18} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="employee-payslips-view">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center p-12">Loading your payslips...</div>
                        ) : myPayslips.length === 0 ? (
                            <div className="col-span-full card p-12 text-center">
                                <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-bold mb-2">No Payslips Yet</h3>
                                <p className="text-secondary text-sm">Your payslips will appear here once they are processed by the Finance team.</p>
                            </div>
                        ) : (
                            myPayslips.map(slip => (
                                <motion.div 
                                    key={slip._id} 
                                    className="payslip-card card hover:shadow-lg transition-all"
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            <Receipt size={24} />
                                        </div>
                                        <span className={`status-badge ${slip.status.toLowerCase()}`}>{slip.status}</span>
                                    </div>
                                    <h3 className="font-bold text-xl mb-1">{monthName(slip.month)}</h3>
                                    <p className="text-secondary text-xs mb-6 uppercase tracking-wider">Salary Disbursement</p>
                                    
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Net Payable</p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(slip.netPay)}</p>
                                        </div>
                                        <button 
                                            className="btn-accent-soft p-2 rounded-lg"
                                            onClick={() => setSelectedSlip(slip)}
                                        >
                                            <FileText size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Payslip Modal */}
            <AnimatePresence>
                {selectedSlip && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Payslip Summary</h2>
                                    <p className="text-blue-100 text-xs">Generated on {new Date(selectedSlip.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-full" onClick={() => setSelectedSlip(null)}>
                                    <AlertCircle className="rotate-45" size={24} />
                                </button>
                            </div>
                            
                            <div className="p-8 overflow-y-auto max-h-[80vh]">
                                <div className="grid grid-cols-2 gap-12 mb-10">
                                    <div>
                                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4">Employee Information</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm"><span className="text-secondary">Name:</span> <b>{selectedSlip.userId?.firstName} {selectedSlip.userId?.lastName}</b></div>
                                            <div className="flex justify-between text-sm"><span className="text-secondary">Employee ID:</span> <b>{selectedSlip.userId?.employeeId}</b></div>
                                            <div className="flex justify-between text-sm"><span className="text-secondary">Designation:</span> <b>{selectedSlip.userId?.designation || 'Specialist'}</b></div>
                                            <div className="flex justify-between text-sm"><span className="text-secondary">Period:</span> <b>{monthName(selectedSlip.month)}</b></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4">Attendance Details</h4>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-[10px] text-secondary font-bold">Calendar Days</p>
                                                <p className="text-lg font-bold">{selectedSlip.attendance?.totalDays}</p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded-xl text-green-700">
                                                <p className="text-[10px] text-green-600 font-bold">Present</p>
                                                <p className="text-lg font-bold">{selectedSlip.attendance?.presentDays}</p>
                                            </div>
                                            <div className="p-3 bg-red-50 rounded-xl text-red-700">
                                                <p className="text-[10px] text-red-600 font-bold">LOP Days</p>
                                                <p className="text-lg font-bold">{selectedSlip.attendance?.lopDays}</p>
                                            </div>
                                            <div className="p-3 bg-purple-50 rounded-xl text-purple-700">
                                                <p className="text-[10px] text-purple-600 font-bold">Performance</p>
                                                <p className="text-lg font-bold">{selectedSlip.attendance?.performanceFactor || 100}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 border-t border-dashed border-gray-200 pt-10">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
                                            <Landmark size={18} className="text-blue-600" /> Earnings
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm"><span>Basic Salary</span> <b>{formatCurrency(selectedSlip.basic)}</b></div>
                                            <div className="flex justify-between text-sm"><span>House Rent Allowance</span> <b>{formatCurrency(selectedSlip.hra)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Conveyance Allowance</span> <b>{formatCurrency(selectedSlip.conveyance)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Medical Allowance</span> <b>{formatCurrency(selectedSlip.medicalAllowance)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Performance Allowance</span> <b>{formatCurrency(selectedSlip.performanceAllowance || 0)}</b></div>
                                            <div className="flex justify-between text-sm"><span>PF Component (Earnings)</span> <b>{formatCurrency(selectedSlip.pfComponent || 0)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Gratuity</span> <b>{formatCurrency(selectedSlip.gratuity || 0)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Bonus</span> <b>{formatCurrency(selectedSlip.bonus || 0)}</b></div>
                                            <div className="flex justify-between font-bold pt-4 border-t border-gray-100">
                                                <span>Gross Salary</span> <span>{formatCurrency(selectedSlip.totalEarnings)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
                                            <CreditCard size={18} className="text-red-500" /> Standard Deductions
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm"><span>PF (Employee Contribution)</span> <b>{formatCurrency(selectedSlip.providentFund)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Health Insurance</span> <b>{formatCurrency(selectedSlip.healthInsurance || 0)}</b></div>
                                            <div className="flex justify-between text-sm"><span>Professional Tax</span> <b>{formatCurrency(selectedSlip.professionalTax)}</b></div>
                                            {selectedSlip.incomeTax > 0 && <div className="flex justify-between text-sm"><span>Income Tax (TDS)</span> <b>{formatCurrency(selectedSlip.incomeTax)}</b></div>}
                                            <div className="flex justify-between font-bold pt-4 border-t border-gray-100 text-red-600">
                                                <span>Total Deductions</span> <span>{formatCurrency(selectedSlip.totalDeductions)}</span>
                                            </div>
                                        </div>

                                        <h4 className="text-sm font-bold text-gray-800 mt-10 mb-6 flex items-center gap-2">
                                            <TrendingUp size={18} className="text-green-600" /> Employer Contributions
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm"><span>Provident Fund (Employer)</span> <b>{formatCurrency(selectedSlip.employerPF || 0)}</b></div>
                                            <div className="flex justify-between text-sm"><span>ESI (Employer)</span> <b>{formatCurrency(selectedSlip.employerESI || 0)}</b></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-blue-50 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">Net Take Home Salary</p>
                                        <h3 className="text-3xl font-black text-blue-900">{formatCurrency(selectedSlip.netPay)}</h3>
                                        <p className="text-[10px] text-blue-500 mt-1 italic font-medium">Net = (Total Earnings - Total Deductions)</p>
                                    </div>
                                    <button className="btn-primary flex items-center gap-2 px-8" onClick={() => window.print()}>
                                        <Download size={18} /> Download Slips
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hidden Printable Template - Isolated via Portal for perfect printing */}
            {selectedSlip && createPortal(
                <div className="printable-payslip-wrapper">
                    <div className="printable-payslip">
                        <div className="payslip-template">
                            <div className="payslip-header">
                                <img src={logo} alt="Logo" className="company-logo" onError={(e) => e.target.style.display='none'} />
                                <div className="company-name">HELIX SYNERGY CORP PVT LTD</div>
                                <div className="company-address">
                                    Mahaveer Radiance, Opp Madhapur Police Station<br />
                                    Madhapur, Hyderabad - 500081
                                </div>
                                <div className="payslip-title">
                                    Pay slip for the month of {monthName(selectedSlip.month)}
                                </div>
                            </div>

                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td className="label">Name:</td>
                                        <td>{selectedSlip.userId?.firstName} {selectedSlip.userId?.lastName}</td>
                                        <td className="label">Employee No:</td>
                                        <td>{selectedSlip.userId?.employeeId}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">Date of Joining:</td>
                                        <td>{selectedSlip.userId?.joiningDate ? new Date(selectedSlip.userId.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                                        <td className="label">Bank Name:</td>
                                        <td>{selectedSlip.userId?.bankDetails?.bankName || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">Designation:</td>
                                        <td>{selectedSlip.userId?.designation || '-'}</td>
                                        <td className="label">Bank Account No:</td>
                                        <td>{selectedSlip.userId?.bankDetails?.accountNumber || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">Department:</td>
                                        <td>{selectedSlip.userId?.departmentId?.name || 'Operations'}</td>
                                        <td className="label">PF No.:</td>
                                        <td>{selectedSlip.userId?.pfNumber || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">Location:</td>
                                        <td>{selectedSlip.userId?.workLocation || 'Hyderabad'}</td>
                                        <td className="label">UAN:</td>
                                        <td>{selectedSlip.userId?.uanNumber || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">Unit Name:</td>
                                        <td>{selectedSlip.userId?.unitName || 'Mahaveer Radiance'}</td>
                                        <td className="label">ESI No.:</td>
                                        <td>{selectedSlip.userId?.esiNumber || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">Effective Work Days:</td>
                                        <td>{selectedSlip.attendance?.presentDays}</td>
                                        <td className="label">PAN No.:</td>
                                        <td>{selectedSlip.userId?.panNumber || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="label">LOP:</td>
                                        <td>{selectedSlip.attendance?.lopDays}</td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex border-x border-b border-black">
                                <div className="w-1/2 border-r border-black">
                                    <table className="data-table-print">
                                        <thead>
                                            <tr>
                                                <th>Earnings</th>
                                                <th className="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>BASIC</td> <td className="text-right">{selectedSlip.basic?.toFixed(2)}</td></tr>
                                            <tr><td>HRA</td> <td className="text-right">{selectedSlip.hra?.toFixed(2)}</td></tr>
                                            <tr><td>CONVEYANCE ALLOWANCE</td> <td className="text-right">{selectedSlip.conveyance?.toFixed(2)}</td></tr>
                                            <tr><td>MEDICAL ALLOWANCE</td> <td className="text-right">{selectedSlip.medicalAllowance?.toFixed(2)}</td></tr>
                                            <tr><td>PERFORMANCE ALLOWANCE</td> <td className="text-right">{selectedSlip.performanceAllowance?.toFixed(2)}</td></tr>
                                            <tr><td>PF COMPONENT</td> <td className="text-right">{selectedSlip.pfComponent?.toFixed(2)}</td></tr>
                                            <tr><td>GRATUITY</td> <td className="text-right">{selectedSlip.gratuity?.toFixed(2)}</td></tr>
                                            <tr><td>BONUS</td> <td className="text-right">{selectedSlip.bonus?.toFixed(2)}</td></tr>
                                            <tr className="total-row">
                                                <td>Total Earnings: Rs.</td>
                                                <td className="text-right">{selectedSlip.totalEarnings?.toFixed(0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="w-1/2">
                                    <table className="data-table-print">
                                        <thead>
                                            <tr>
                                                <th>Deductions</th>
                                                <th className="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>PF</td> <td className="text-right">{selectedSlip.providentFund?.toFixed(2)}</td></tr>
                                            <tr><td>HEALTH INSURANCE</td> <td className="text-right">{selectedSlip.healthInsurance?.toFixed(2)}</td></tr>
                                            <tr><td>PROF TAX</td> <td className="text-right">{selectedSlip.professionalTax?.toFixed(2)}</td></tr>
                                            <tr><td>LOP DEDUCTIONS</td> <td className="text-right">{selectedSlip.lopDeductions?.toFixed(2)}</td></tr>
                                            <tr><td>INCOME TAX (TDS)</td> <td className="text-right">{selectedSlip.incomeTax?.toFixed(2)}</td></tr>
                                            <tr><td>-</td> <td className="text-right">-</td></tr>
                                            <tr><td>-</td> <td className="text-right">-</td></tr>
                                            <tr><td>-</td> <td className="text-right">-</td></tr>
                                            <tr className="total-row">
                                                <td>Total Deductions: Rs.</td>
                                                <td className="text-right">{selectedSlip.totalDeductions?.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="net-pay-section">
                                <div className="net-pay-amount">
                                    Net Pay for the month (Total Earnings - Total Deductions): {selectedSlip.netPay?.toFixed(2)}
                                </div>
                                <div className="amount-in-words">
                                    ({NumberToWords(Math.round(selectedSlip.netPay))} Only)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </motion.div>
    );
};

// Helper to convert number to words (Simplified Indian Format)
const NumberToWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return 'Rupees ' + str.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.substr(1)).join(' ');
};

export default Payroll;
