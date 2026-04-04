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
        // Redirect to their specific dashboard if trying to access unauthorized route
        const role = user.role;
        let path = '/employee-dashboard';
        if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') path = '/admin-dashboard';
        else if (role === 'MANAGER') path = '/manager-dashboard';
        
        return <Navigate to={path} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
