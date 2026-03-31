import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, User as UserIcon, LogOut, Menu } from 'lucide-react';
import api from '../../api/axios';
import './Header.css';

const Header = ({ onMenuToggle }) => {
    const [isDark, setIsDark] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const navigate = useNavigate();
    const searchRef = React.useRef(null);

    useEffect(() => {
        const theme = document.documentElement.getAttribute('data-theme');
        setIsDark(theme === 'dark');

        const loadUser = () => {
            const storedUser = localStorage.getItem('hems_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        };
        loadUser();
        window.addEventListener('userUpdated', loadUser);

        // Fetch employees for search
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/users');
                setAllEmployees(res.data.data);
            } catch (err) {
                console.error("Failed to fetch employees for search", err);
            }
        };
        fetchEmployees();

        // Keyboard shortcut Cmd+K / Ctrl+K
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('userUpdated', loadUser);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const filtered = allEmployees.filter(emp => 
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5);
            setSearchResults(filtered);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchQuery, allEmployees]);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        setIsDark(!isDark);
    };

    const handleLogout = () => {
        localStorage.removeItem('hems_token');
        localStorage.removeItem('hems_user');
        navigate('/login');
    };

    const handleResultClick = (employeeId) => {
        setSearchQuery('');
        setShowSearchResults(false);
        navigate(`/directory?id=${employeeId}`);
    };

    return (
        <header className="top-header">
            <div className="header-left">
                <button className="mobile-menu-toggle" onClick={onMenuToggle}>
                    <Menu size={24} />
                </button>
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input 
                        ref={searchRef}
                        type="text" 
                        placeholder="Search employees... (Cmd+K)" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                        onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                    />
                    
                    <AnimatePresence>
                        {showSearchResults && searchResults.length > 0 && (
                            <motion.div 
                                className="search-results-dropdown card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                {searchResults.map(emp => (
                                    <div 
                                        key={emp._id} 
                                        className="search-result-item"
                                        onClick={() => handleResultClick(emp._id)}
                                    >
                                        <div className="result-avatar">
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                        <div className="result-info">
                                            <span className="result-name">{emp.firstName} {emp.lastName}</span>
                                            <span className="result-meta text-tertiary">{emp.designation || 'Employee'} • {emp.employeeId}</span>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                        {showSearchResults && searchQuery.length > 1 && searchResults.length === 0 && (
                            <motion.div 
                                className="search-results-dropdown card no-results"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                No employees found
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="icon-btn notification-btn">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="profile-wrapper">
                    <button
                        className="profile-btn"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        {user?.profilePicture && !user.profilePicture.includes('ui-avatars') ? (
                            <img src={user.profilePicture} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-300" />
                        ) : (
                            <div className="avatar">
                                {user ? (user.firstName ? `${user.firstName[0]}${user.lastName?.[0] || ''}` : user.name?.[0]) || 'U' : 'U'}
                            </div>
                        )}
                        <div className="profile-info">
                            <span className="profile-name">
                                {user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name) || 'User' : 'User'}
                            </span>
                            <span className="profile-role capitalize">{user?.role ? user.role.toLowerCase().replace('_', ' ') : 'Employee'}</span>
                        </div>
                    </button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                className="profile-dropdown card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}>
                                    <UserIcon size={16} /> My Profile
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item text-danger" onClick={handleLogout}>
                                    <LogOut size={16} /> Logout
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
