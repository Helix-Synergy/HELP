import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Monitor, Smartphone, Briefcase, ChevronLeft, Save, 
    Keyboard, Mouse, Headphones, Camera, Zap, Printer, Server, Network, Tablet,
    AlertCircle, Info, UserPlus
} from 'lucide-react';
import api from '../../api/axios';
import './AddAsset.css';

const AddAsset = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category: 'LAPTOP',
        serialNumber: '',
        condition: 'NEW',
        assignedTo: ''
    });

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(user?.role)) {
            navigate('/assets');
            return;
        }
        fetchUsers();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data);
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Clean up data
        const dataToSubmit = { ...formData };
        if (!dataToSubmit.assignedTo) {
            dataToSubmit.assignedTo = null; // Backend expects null or valid ObjectId
        }

        try {
            await api.post('/assets', dataToSubmit);
            alert('Asset created successfully!');
            navigate('/assets');
        } catch (error) {
            alert('Error creating asset. Serial number might be duplicate.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (cat) => {
        const iconSize = 24;
        switch (cat) {
            case 'LAPTOP': return <Monitor size={iconSize} />;
            case 'MOBILE': return <Smartphone size={iconSize} />;
            case 'MONITOR': return <Monitor size={iconSize} />;
            case 'KEYBOARD': return <Keyboard size={iconSize} />;
            case 'MOUSE': return <Mouse size={iconSize} />;
            case 'HEADSET': return <Headphones size={iconSize} />;
            case 'WEBCAM': return <Camera size={iconSize} />;
            case 'UPS': return <Zap size={iconSize} />;
            case 'PRINTER': return <Printer size={iconSize} />;
            case 'SERVER': return <Server size={iconSize} />;
            case 'NETWORKING': return <Network size={iconSize} />;
            case 'TABLET': return <Tablet size={iconSize} />;
            default: return <Briefcase size={iconSize} />;
        }
    };

    return (
        <motion.div 
            className="add-asset-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="add-asset-header">
                <button className="back-btn" onClick={() => navigate('/assets')}>
                    <ChevronLeft size={20} /> Back to Inventory
                </button>
                <div className="header-content">
                    <h1 className="page-title">Add New Inventory Item</h1>
                    <p className="page-subtitle">Register a new corporate asset and optionally assign it to an employee.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="add-asset-container">
                <div className="form-main">
                    {/* Device Identity Section */}
                    <section className="form-section card">
                        <div className="section-header">
                            <div className="section-icon identity">
                                {getIcon(formData.category)}
                            </div>
                            <div>
                                <h3 className="section-title">Device Identification</h3>
                                <p className="section-desc">Basic details to identify the hardware in the system.</p>
                            </div>
                        </div>

                        <div className="section-content grid-2">
                            <div className="form-group">
                                <label>Device Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. MacBook Air M2 13-inch"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Asset Category</label>
                                <select 
                                    className="input-field" 
                                    value={formData.category} 
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="LAPTOP">Laptop</option>
                                    <option value="MONITOR">Monitor</option>
                                    <option value="MOBILE">Mobile Device</option>
                                    <option value="TABLET">Tablet</option>
                                    <option value="KEYBOARD">Keyboard</option>
                                    <option value="MOUSE">Mouse</option>
                                    <option value="HEADSET">Headset/Headphones</option>
                                    <option value="WEBCAM">Webcam</option>
                                    <option value="UPS">UPS/Power Bank</option>
                                    <option value="PRINTER">Printer</option>
                                    <option value="SERVER">Server</option>
                                    <option value="NETWORKING">Networking Gear</option>
                                    <option value="ACCESSORY">Other Accessory</option>
                                    <option value="FURNITURE">Furniture</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Serial Number (Unique)</label>
                                <div className="input-with-icon">
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Enter unique S/N"
                                        className="input-field font-mono"
                                        value={formData.serialNumber}
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                    <Info size={16} className="field-icon" title="Serial number must be unique across all inventory" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Assignment Section */}
                    <section className="form-section card">
                        <div className="section-header">
                            <div className="section-icon assignment">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="section-title">Assignment & Condition</h3>
                                <p className="section-desc">Assign this asset to a specific team member.</p>
                            </div>
                        </div>

                        <div className="section-content grid-2">
                            <div className="form-group">
                                <label>Assign To (Optional)</label>
                                <select 
                                    className="input-field" 
                                    value={formData.assignedTo} 
                                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                >
                                    <option value="">Keep in Inventory (Unassigned)</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>
                                            {u.firstName} {u.lastName} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Initial Condition</label>
                                <select 
                                    className="input-field" 
                                    value={formData.condition} 
                                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                >
                                    <option value="NEW">New - Box Piece</option>
                                    <option value="GOOD">Good - Minimal Use</option>
                                    <option value="FAIR">Fair - Noticeable Wear</option>
                                    <option value="POOR">Poor - Needs Repair</option>
                                </select>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="form-sidebar">
                    <div className="sticky-sidebar">
                        <div className="card summary-card">
                            <h3 className="summary-title">Asset Summary</h3>
                            <div className="summary-item">
                                <span className="label">Category:</span>
                                <span className="value">{formData.category.charAt(0) + formData.category.slice(1).toLowerCase()}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Status:</span>
                                <span className="value capitalize">{formData.assignedTo ? 'Direct Assignment' : 'Stock Inventory'}</span>
                            </div>
                            
                            <div className="guidelines">
                                <div className="guideline-item">
                                    <AlertCircle size={16} className="text-warning" />
                                    <span>Ensure S/N matches the physical device</span>
                                </div>
                                <div className="guideline-item">
                                    <AlertCircle size={16} className="text-info" />
                                    <span>Assignment can be changed later from masterlist</span>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary full-width submit-btn" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : <><Save size={18} /> Register Asset</>}
                            </button>
                            <button 
                                type="button" 
                                className="btn-secondary full-width" 
                                onClick={() => navigate('/assets')}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </motion.div>
    );
};

export default AddAsset;
