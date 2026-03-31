import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

    return (
        <div className="dashboard-container">
            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <motion.div
                        className="sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
            
            <div className="dashboard-main">
                <Header onMenuToggle={() => setIsMobileSidebarOpen(true)} />
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
