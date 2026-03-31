import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import './Login.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await api.put(`/auth/resetpassword/${token}`, { password });
            
            // Store new token and user data
            localStorage.setItem('hems_token', res.data.token);
            localStorage.setItem('hems_user', JSON.stringify(res.data.user));
            
            setIsLoading(false);
            setIsSuccess(true);
        } catch (err) {
            setIsLoading(false);
            setError(err.response?.data?.message || 'Password reset failed. Token might be expired.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-left">
                    <div className="brand-logo">
                        <div className="logo-icon"></div>
                        <span>HEMS BITWOLFT CORP</span>
                    </div>
                    <h1>Set a New <br />Secure Password.</h1>
                    <p>Enter your new password below. Make sure it's something secure and unique to your account.</p>
                </div>

                <div className="login-right">
                    <motion.div 
                        className="login-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="login-header">
                            <h2>Reset password</h2>
                            <p>Please enter and confirm your new password.</p>
                        </div>

                        {isSuccess ? (
                            <div className="success-state">
                                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Password changed!</h3>
                                <p className="text-secondary mb-6">Your password has been successfully reset. You are now logged in.</p>
                                <button className="btn-primary w-full" onClick={() => navigate('/dashboard')}>
                                    Go to Dashboard
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="login-form">
                                {error && (
                                    <div className="error-message">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input-field password-input"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                        <button 
                                            type="button" 
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <div className="input-with-icon">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input-field"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn-primary login-btn"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>

                                <Link to="/login" className="back-link justify-center mt-6">
                                    <ArrowLeft size={16} />
                                    Back to Login
                                </Link>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
