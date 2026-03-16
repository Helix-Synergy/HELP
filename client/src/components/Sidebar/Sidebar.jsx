import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, Clock, CalendarOff,
    Briefcase, CheckSquare, FileText, Settings, Target, Receipt, HeadphonesIcon, Monitor, BookOpen, GitMerge,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import logo from '../../assets/logo.jpg';
import './Sidebar.css';

const navItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Directory', icon: <Users size={20} />, path: '/directory', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
    { title: 'Attendance', icon: <Clock size={20} />, path: '/attendance', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Leaves', icon: <CalendarOff size={20} />, path: '/leaves', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Timesheets', icon: <CheckSquare size={20} />, path: '/timesheets', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Documents', icon: <FileText size={20} />, path: '/documents', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Onboarding', icon: <CheckSquare size={20} />, path: '/onboarding', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Performance', icon: <Target size={20} />, path: '/performance', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Helpdesk', icon: <HeadphonesIcon size={20} />, path: '/helpdesk', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Assets', icon: <Monitor size={20} />, path: '/assets', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Learning', icon: <BookOpen size={20} />, path: '/learning', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Org Chart', icon: <GitMerge size={20} />, path: '/orgchart', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Settings', icon: <Settings size={20} />, path: '/settings', roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
];

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Get user from local storage
    const userStr = localStorage.getItem('hems_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role || 'EMPLOYEE';

    const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

    return (
        <motion.aside
            className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
            animate={{ width: isCollapsed ? 80 : 260 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src={logo} alt="Logo" className="sidebar-logo-img" />
                    {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ whiteSpace: 'nowrap' }}>Helix Synergy</motion.span>}
                </div>
                <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {filteredNavItems.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                title={item.title}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!isCollapsed && <span className="nav-text">{item.title}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                {/* Can put a user mini-profile or "Help" here */}
            </div>
        </motion.aside>
    );
};

export default Sidebar;
