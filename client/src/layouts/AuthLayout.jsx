import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AuthLayout.css';

const AuthLayout = () => {
    return (
        <div className="auth-container">
            <div className="auth-left">
                <motion.div
                    className="brand-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="logo-container">
                        <div className="logo-icon"></div>
                        <h1>HELP</h1>
                    </div>
                    <h2>Enterprise People Management,<br />Simplified.</h2>
                    <p>Streamline your HR workflows, track attendance, and empower employees with a beautiful, fast interface.</p>
                </motion.div>

                {/* Animated Background Elements */}
                <div className="bg-glow glow-1"></div>
                <div className="bg-glow glow-2"></div>
            </div>

            <div className="auth-right">
                <motion.div
                    className="auth-box"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Outlet />
                </motion.div>
            </div>
        </div>
    );
};

export default AuthLayout;
