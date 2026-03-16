import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });

            // Store token and user data
            localStorage.setItem('hems_token', res.data.token);
            localStorage.setItem('hems_user', JSON.stringify(res.data.user));

            setIsLoading(false);
            navigate('/dashboard');
        } catch (err) {
            setIsLoading(false);
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-header">
                <h2>Welcome back</h2>
                <p>Enter your details to access your account.</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}

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

                <div className="form-group">
                    <div className="password-header">
                        <label>Password</label>
                        <a href="#" className="forgot-link">Forgot password?</a>
                    </div>
                    <div className="input-with-icon">
                        <Lock className="input-icon" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="input-field password-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="button" 
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex="-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary login-btn"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="spinner"></div>
                    ) : (
                        <>
                            Sign In
                            <LogIn size={18} />
                        </>
                    )}
                </motion.button>
            </form>
        </div>
    );
};

export default Login;
