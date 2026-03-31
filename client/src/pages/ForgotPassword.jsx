import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import './Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/forgotpassword', { email });
            setIsLoading(false);
            setIsSent(true);
        } catch (err) {
            setIsLoading(false);
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
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
                    <h1>Empowering Workforce, <br />Simplifying Growth.</h1>
                    <p>Access your personalized employee dashboard to manage attendance, leaves, projects, and more with ease.</p>
                </div>

                <div className="login-right">
                    <motion.div 
                        className="login-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>

                        <div className="login-header">
                            <h2>Forgot password?</h2>
                            <p>Enter your email and we'll send you instructions to reset your password.</p>
                        </div>

                        <AnimatePresence mode='wait'>
                            {isSent ? (
                                <motion.div 
                                    key="success"
                                    className="success-state"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="success-icon">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3>Check your email</h3>
                                    <p>We've sent password reset instructions to <strong>{email}</strong></p>
                                    <button 
                                        className="btn-primary w-full mt-6"
                                        onClick={() => navigate('/login')}
                                    >
                                        Return to Login
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form 
                                    key="form"
                                    onSubmit={handleSubmit} 
                                    className="login-form"
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {error && (
                                        <div className="error-message">
                                            <AlertCircle size={18} />
                                            {error}
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Email address</label>
                                        <div className="input-with-icon">
                                            <Mail className="input-icon" size={18} />
                                            <input
                                                type="email"
                                                className="input-field"
                                                placeholder="e.g. john@helix.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
