import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Directory from './pages/Directory/Directory';
import EditEmployee from './pages/EditEmployee/EditEmployee';
import Attendance from './pages/Attendance/Attendance';
import Leaves from './pages/Leaves/Leaves';
import ApplyLeave from './pages/ApplyLeave/ApplyLeave';
import Timesheets from './pages/Timesheets/Timesheets';
import Documents from './pages/Documents/Documents';
import Payroll from './pages/Payroll/Payroll';
import Onboarding from './pages/Onboarding/Onboarding';
import OnboardingDetails from './pages/Onboarding/OnboardingDetails';
import Performance from './pages/Performance/Performance';
import Helpdesk from './pages/Helpdesk/Helpdesk';
import Assets from './pages/Assets/Assets';
import AddAsset from './pages/AddAsset/AddAsset';
import Learning from './pages/Learning/Learning';
import OrgChart from './pages/OrgChart/OrgChart';
import Settings from './pages/Settings/Settings';
import { useLocation } from 'react-router-dom';

const DashboardRedirect = () => {
  const userStr = localStorage.getItem('hems_user');
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  const role = user.role;
  
  if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (role === 'MANAGER') {
    return <Navigate to="/manager-dashboard" replace />;
  } else {
    return <Navigate to="/employee-dashboard" replace />;
  }
};

function App() {
  useEffect(() => {
    // document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Dashboard Routes (Protected by Auth) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* All Employees */}
            <Route path="/admin-dashboard" element={<Dashboard />} />
            <Route path="/manager-dashboard" element={<Dashboard />} />
            <Route path="/employee-dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="leaves/apply" element={<ApplyLeave />} />
            <Route path="/timesheets" element={<Timesheets />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/onboarding/details/:userId" element={<OnboardingDetails />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/helpdesk" element={<Helpdesk />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/new" element={<AddAsset />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/orgchart" element={<OrgChart />} />
            <Route path="/settings" element={<Settings />} />

            {/* Manager or Admin */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']} />}>
              <Route path="/directory" element={<Directory />} />
              <Route path="/directory/edit/:id" element={<EditEmployee />} />
            </Route>

            {/* Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']} />}>

            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
