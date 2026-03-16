import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Check, Save, Send, AlertCircle, Calendar as CalendarIcon, FileClock } from 'lucide-react';
import api from '../../api/axios';
import './Timesheets.css';

const Timesheets = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [projects, setProjects] = useState([]);
    const [timesheetData, setTimesheetData] = useState([]);
    const [status, setStatus] = useState('DRAFT');
    const [isLoading, setIsLoading] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [teamTimesheets, setTeamTimesheets] = useState([]);

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const managerFlag = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role);
        setIsManager(managerFlag);

        fetchData(managerFlag);
    }, [currentDate]);

    // Compute Date Range String
    const getWeekBoundaries = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { monday, sunday };
    };

    const weekBounds = getWeekBoundaries(currentDate);

    const fetchData = async (managerFlag = isManager) => {
        try {
            // Get Projects
            const projRes = await api.get('/projects');
            setProjects(projRes.data.data);

            // Get My Timesheets
            const myRes = await api.get('/timesheets/me');
            if (myRes.data.data.length > 0) {
                // Find timesheet matching this week
                const currentSheet = myRes.data.data.find(sheet => {
                    const sheetDate = new Date(sheet.weekStartDate);
                    return sheetDate.getTime() === weekBounds.monday.getTime();
                });

                if (currentSheet) {
                    setTimesheetData(currentSheet.entries.map((entry, index) => ({
                        id: index,
                        projectId: entry.project?._id,
                        task: entry.taskDescription,
                        hours: [
                            entry.hours.monday || '', entry.hours.tuesday || '', entry.hours.wednesday || '',
                            entry.hours.thursday || '', entry.hours.friday || '', entry.hours.saturday || '', entry.hours.sunday || ''
                        ]
                    })));
                    setStatus(currentSheet.status);
                } else {
                    setTimesheetData([]);
                    setStatus('DRAFT');
                }
            } else {
                setTimesheetData([]);
                setStatus('DRAFT');
            }

            // Get Team Timesheets if Manager
            if (managerFlag) {
                const teamRes = await api.get('/timesheets');
                setTeamTimesheets(teamRes.data.data);
            }

        } catch (err) {
            console.error("Failed to fetch timesheet data", err);
        }
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleAddRow = () => {
        if (status === 'SUBMITTED' || status === 'APPROVED') return;
        setTimesheetData([...timesheetData, {
            id: Date.now(),
            projectId: projects.length > 0 ? projects[0]._id : '',
            task: '',
            hours: ['', '', '', '', '', '', '']
        }]);
    };

    const handleHourChange = (rowIndex, dayIndex, value) => {
        if (status === 'SUBMITTED' || status === 'APPROVED') return;
        const newData = [...timesheetData];
        newData[rowIndex].hours[dayIndex] = value;
        setTimesheetData(newData);
    };

    const handleProjectChange = (rowIndex, projectId) => {
        if (status === 'SUBMITTED' || status === 'APPROVED') return;
        const newData = [...timesheetData];
        newData[rowIndex].projectId = projectId;
        setTimesheetData(newData);
    };

    const handleTaskChange = (rowIndex, task) => {
        if (status === 'SUBMITTED' || status === 'APPROVED') return;
        const newData = [...timesheetData];
        newData[rowIndex].task = task;
        setTimesheetData(newData);
    };

    const deleteRow = (rowIndex) => {
        if (status === 'SUBMITTED' || status === 'APPROVED') return;
        const newData = [...timesheetData];
        newData.splice(rowIndex, 1);
        setTimesheetData(newData);
    };

    const saveOrSubmit = async (targetStatus) => {
        if (targetStatus === 'SUBMITTED') {
            const confirmSubmit = window.confirm("Are you sure you want to submit this timesheet for approval? You won't be able to edit it until it's reviewed.");
            if (!confirmSubmit) return;
        }

        try {
            setIsLoading(true);

            // Format to API specs
            const entries = timesheetData.filter(row => row.projectId).map(row => ({
                project: row.projectId,
                taskDescription: row.task || 'General Work',
                hours: {
                    monday: parseFloat(row.hours[0]) || 0,
                    tuesday: parseFloat(row.hours[1]) || 0,
                    wednesday: parseFloat(row.hours[2]) || 0,
                    thursday: parseFloat(row.hours[3]) || 0,
                    friday: parseFloat(row.hours[4]) || 0,
                    saturday: parseFloat(row.hours[5]) || 0,
                    sunday: parseFloat(row.hours[6]) || 0,
                }
            }));

            if (entries.length === 0 && targetStatus === 'SUBMITTED') {
                alert("Please add at least one project row with hours before submitting.");
                setIsLoading(false);
                return;
            }

            const payload = {
                weekStartDate: weekBounds.monday,
                weekEndDate: weekBounds.sunday,
                entries: entries,
                status: targetStatus
            };

            await api.post('/timesheets', payload);
            setStatus(targetStatus);
            
            if (targetStatus === 'SUBMITTED') {
                alert("Timesheet submitted successfully! It has been sent to your manager for approval.");
            } else {
                alert("Draft saved successfully!");
            }
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save timesheet: " + (err.response?.data?.error || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const approveRejectTimesheet = async (id, newStatus) => {
        try {
            await api.put(`/timesheets/${id}/status`, { status: newStatus });
            fetchData();
        } catch (err) {
            alert('Failed to update timesheet status');
        }
    };

    // Calculate totals
    const dailyTotals = days.map((_, dayIndex) => {
        return timesheetData.reduce((sum, row) => sum + (parseFloat(row.hours[dayIndex]) || 0), 0);
    });
    const weeklyTotal = dailyTotals.reduce((a, b) => a + b, 0);

    const isLocked = status === 'SUBMITTED' || status === 'APPROVED';

    return (
        <motion.div className="timesheets-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="directory-header">
                <div>
                    <h1 className="page-title">Timesheets</h1>
                    <p className="page-subtitle">Log your daily hours, track billable projects, and submit for approval.</p>
                </div>
                {!isLocked && (
                    <div className="header-actions-group">
                        <button className="btn-secondary" onClick={() => saveOrSubmit('DRAFT')} disabled={isLoading}>
                            <Save size={18} /> {isLoading ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button className="btn-primary" onClick={() => saveOrSubmit('SUBMITTED')} disabled={isLoading || timesheetData.length === 0}>
                            <Send size={18} /> Submit to Manager
                        </button>
                    </div>
                )}
            </div>

            <div className="card timesheet-card mb-4">
                <div className="timesheet-header-controls">
                    <div className="week-selector">
                        <button className="btn-secondary" onClick={handlePrevWeek}>&lt;</button>
                        <div className="current-week-display">
                            <CalendarIcon size={18} className="text-tertiary" />
                            <span>{weekBounds.monday.toLocaleDateString()} - {weekBounds.sunday.toLocaleDateString()}</span>
                        </div>
                        <button className="btn-secondary" onClick={handleNextWeek}>&gt;</button>
                    </div>
                    <div className={`timesheet-status bg-${status === 'APPROVED' ? 'success' : status === 'SUBMITTED' ? 'accent' : 'warning'}`}>
                        <Clock size={16} /> {status}
                    </div>
                </div>

                <div className="timesheet-grid-wrapper">
                    <table className="timesheet-table">
                        <thead>
                            <tr>
                                <th className="th-project">Project / Task</th>
                                {displayDays.map((day, idx) => {
                                    const colDate = new Date(weekBounds.monday);
                                    colDate.setDate(colDate.getDate() + idx);
                                    return (
                                        <th key={day} className={`th-day ${idx > 4 ? 'weekend' : ''}`}>
                                            <div className="day-name">{day}</div>
                                            <div className="day-date">{colDate.getDate()}</div>
                                        </th>
                                    );
                                })}
                                <th className="th-total">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timesheetData.map((row, rowIndex) => {
                                const rowTotal = row.hours.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
                                return (
                                    <tr key={row.id}>
                                        <td className="td-project">
                                            <div className="ts-project-info flex gap-2 w-full">
                                                <select
                                                    className="input-field py-1 px-2 text-sm w-full font-semibold"
                                                    value={row.projectId}
                                                    onChange={(e) => handleProjectChange(rowIndex, e.target.value)}
                                                    disabled={isLocked}
                                                >
                                                    <option value="" disabled>Select Project</option>
                                                    {projects.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name} ({p.projectCode})</option>
                                                    ))}
                                                </select>
                                                {!isLocked && (
                                                    <button className="text-danger flex-shrink-0" onClick={() => deleteRow(rowIndex)}>X</button>
                                                )}
                                            </div>
                                            <div className="ts-task-input mt-2">
                                                <input
                                                    type="text"
                                                    value={row.task}
                                                    onChange={(e) => handleTaskChange(rowIndex, e.target.value)}
                                                    placeholder="Task description..."
                                                    disabled={isLocked}
                                                />
                                            </div>
                                        </td>
                                        {row.hours.map((hours, dayIndex) => (
                                            <td key={dayIndex} className={`td-hour ${dayIndex > 4 ? 'weekend' : ''}`}>
                                                <input
                                                    type="number"
                                                    min="0" max="24" step="0.5"
                                                    value={hours}
                                                    onChange={(e) => handleHourChange(rowIndex, dayIndex, e.target.value)}
                                                    className={`hour-input ${hours ? 'has-value' : ''}`}
                                                    placeholder="-"
                                                    disabled={isLocked}
                                                />
                                            </td>
                                        ))}
                                        <td className="td-total">
                                            <div className="row-total">{rowTotal}h</div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!isLocked && (
                                <tr className="add-row-tr">
                                    <td colSpan={9}>
                                        <button className="text-btn text-accent flex-center gap-2 py-2" onClick={handleAddRow}>
                                            <Plus size={16} /> Add Project Row
                                        </button>
                                    </td>
                                </tr>
                            )}
                            <tr className="totals-row">
                                <td className="td-project text-right pr-4"><strong>Daily Totals</strong></td>
                                {dailyTotals.map((total, idx) => (
                                    <td key={idx} className="td-hour">
                                        <div className={`col-total ${total > 8 ? 'overtime' : ''}`}>{total}h</div>
                                    </td>
                                ))}
                                <td className="td-total">
                                    <div className="grand-total">{weeklyTotal}h</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {isManager && (
                <div className="card mt-6">
                    <div className="card-header border-b border-gray-100 pb-4 mb-4">
                        <h3>Team Timesheet Approvals</h3>
                    </div>
                    {teamTimesheets.length === 0 ? (
                        <p className="text-secondary p-4 text-center">No pending timesheets for your team.</p>
                    ) : (
                        <table className="data-table w-full">
                            <thead>
                                <tr>
                                    <th className="text-left font-medium text-gray-500 pb-2">Employee</th>
                                    <th className="text-left font-medium text-gray-500 pb-2">Week Of</th>
                                    <th className="text-left font-medium text-gray-500 pb-2">Total Hours</th>
                                    <th className="text-left font-medium text-gray-500 pb-2">Projects</th>
                                    <th className="text-left font-medium text-gray-500 pb-2">Status</th>
                                    <th className="text-right font-medium text-gray-500 pb-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamTimesheets.map(sheet => (
                                    <tr key={sheet._id} className="border-b border-gray-50">
                                        <td className="py-3">
                                            <div className="font-medium text-gray-900">{sheet.user.firstName} {sheet.user.lastName}</div>
                                            <div className="text-sm text-gray-500">{sheet.user.email}</div>
                                        </td>
                                        <td className="py-3 text-gray-600">{new Date(sheet.weekStartDate).toLocaleDateString()}</td>
                                        <td className="py-3 font-semibold text-gray-900">{sheet.totalHours}h</td>
                                        <td className="py-3 text-gray-600">
                                            {Array.from(new Set(sheet.entries.map(e => e.project?.projectCode))).join(', ')}
                                        </td>
                                        <td className="py-3">
                                            <span className={`file-badge ${sheet.status === 'APPROVED' ? 'bg-success text-white' : 'bg-accent text-white'}`}>
                                                {sheet.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            {sheet.status === 'SUBMITTED' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                                                        onClick={() => approveRejectTimesheet(sheet._id, 'APPROVED')}
                                                    >Approve</button>
                                                    <button
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                                                        onClick={() => approveRejectTimesheet(sheet._id, 'REJECTED')}
                                                    >Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default Timesheets;
