import React, { useState, useEffect } from 'react';
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
    { title: 'Payroll', icon: <Receipt size={20} />, path: '/payroll', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE'] },
    { title: 'Onboarding', icon: <CheckSquare size={20} />, path: '/onboarding', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Performance', icon: <Target size={20} />, path: '/performance', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Helpdesk', icon: <HeadphonesIcon size={20} />, path: '/helpdesk', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Assets', icon: <Monitor size={20} />, path: '/assets', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Learning', icon: <BookOpen size={20} />, path: '/learning', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Org Chart', icon: <GitMerge size={20} />, path: '/orgchart', roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { title: 'Settings', icon: <Settings size={20} />, path: '/settings', roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
];

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState(() => {
        const userStr = localStorage.getItem('hems_user');
        return userStr ? JSON.parse(userStr) : null;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const userStr = localStorage.getItem('hems_user');
            if (userStr) setUser(JSON.parse(userStr));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userChange', handleStorageChange); // Custom event for same-tab updates

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userChange', handleStorageChange);
        };
    }, []);

    const userRole = user?.role || 'EMPLOYEE';

    let filteredNavItems = navItems.filter(item => item.roles.includes(userRole)).map(item => {
        if (item.title === 'Dashboard') {
            let path = '/employee-dashboard';
            if (userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN') path = '/admin-dashboard';
            else if (userRole === 'MANAGER') path = '/manager-dashboard';
            return { ...item, path };
        }
        return item;
    });

    // Strict Onboarding Filter
    if (userRole === 'EMPLOYEE' && user?.onboardingStatus !== 'COMPLETED') {
        filteredNavItems = filteredNavItems.filter(item => item.path === '/onboarding');
    }

    return (
        <motion.aside
            className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
            animate={{
                width: isCollapsed ? 80 : 260,
                x: typeof window !== 'undefined' && window.innerWidth <= 768 ? (isMobileOpen ? 0 : -280) : 0
            }}
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
                                onClick={() => setIsMobileOpen(false)}
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
