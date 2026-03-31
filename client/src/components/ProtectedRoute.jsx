import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('hems_token');
    const userStr = localStorage.getItem('hems_user');
    const location = useLocation();

    if (!token || !userStr) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const user = JSON.parse(userStr);

    // Strict Onboarding Check for Employees
    if (user.role === 'EMPLOYEE' && user.onboardingStatus !== 'COMPLETED') {
        if (location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to dashboard if trying to access unauthorized route
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
