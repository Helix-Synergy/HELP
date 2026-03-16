import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './DashboardLayout.css';

const DashboardLayout = () => {
    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-main">
                <Header />
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
