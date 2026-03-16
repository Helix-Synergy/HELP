import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Briefcase, Plus, CheckCircle, Clock, X } from 'lucide-react';
import api from '../../api/axios';
import './Assets.css';

const Assets = () => {
    const [myAssets, setMyAssets] = useState([]);
    const [allAssets, setAllAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Modal states
    const [showNewAssetModal, setShowNewAssetModal] = useState(false);

    // Form state
    const [newAsset, setNewAsset] = useState({ name: '', category: 'LAPTOP', serialNumber: '', condition: 'NEW' });

    useEffect(() => {
        const userStr = localStorage.getItem('hems_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        setUser(currentUser);
        setIsAdmin(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(currentUser?.role));

        fetchData();
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const myRes = await api.get('/assets/me');
            setMyAssets(myRes.data.data);

            if (isAdmin) {
                const allRes = await api.get('/assets');
                setAllAssets(allRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching assets', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users'); // Corrected from /directory
            setUsers(res.data.data);
        } catch (error) {
            console.error('Error fetching users for assignment', error);
        }
    }

    const handleCreateAsset = async (e) => {
        e.preventDefault();
        try {
            await api.post('/assets', newAsset);
            setShowNewAssetModal(false);
            setNewAsset({ name: '', category: 'LAPTOP', serialNumber: '', condition: 'NEW' });
            fetchData();
        } catch (error) {
            alert('Error creating asset. Serial number might be duplicate.');
        }
    };

    const getIcon = (cat) => {
        switch (cat) {
            case 'LAPTOP': return <Monitor size={20} className="text-blue-500" />;
            case 'MOBILE': return <Smartphone size={20} className="text-green-500" />;
            case 'MONITOR': return <Monitor size={20} className="text-purple-500" />;
            default: return <Briefcase size={20} className="text-gray-500" />;
        }
    };

    return (
        <motion.div className="h-[calc(100vh-80px)] flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 flex-shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight mb-1">Hardware & Assets</h1>
                    <p className="text-gray-500 font-medium tracking-wide">View your assigned corporate hardware and inventory.</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowNewAssetModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0">
                        <Plus size={20} /> <span className="tracking-wide">New Asset</span>
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-8 pb-10">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden ring-1 ring-black/5">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-800">My Assigned Devices</h3>
                    </div>
                    <div className="p-6">
                        {isLoading ? <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div></div> : myAssets.length === 0 ? (
                            <div className="text-center p-10 space-y-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                                    <Monitor size={28} className="text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">No assets currently assigned to you.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myAssets.map(asset => (
                                    <div key={asset._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 hover:border-blue-200 group">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                            {getIcon(asset.category)}
                                        </div>
                                        <div className="asset-details">
                                            <h4 className="text-lg font-bold text-gray-900 mb-1">{asset.name}</h4>
                                            <p className="text-xs text-gray-500 font-mono bg-gray-50 inline-block px-2.5 py-1 rounded-md border border-gray-100">S/N: {asset.serialNumber}</p>
                                            <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-50">
                                                <span className="text-xs font-bold uppercase tracking-wider bg-gray-100/80 text-gray-600 px-3 py-1.5 rounded-lg">{asset.condition}</span>
                                                <span className="text-xs text-emerald-600 font-bold tracking-wide flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50"><CheckCircle size={14} /> ASSIGNED</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden ring-1 ring-black/5 mt-2">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">Corporate Inventory Masterlist</h3>
                            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{allAssets.length} Items</span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            {isLoading ? <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div></div> : allAssets.length === 0 ? (
                                <div className="text-center p-10"><p className="text-gray-500 font-medium">Inventory is empty.</p></div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">Device Name</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">Serial Number</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">Status</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap">Condition</th>
                                            <th className="px-6 py-4 font-bold whitespace-nowrap relative">Assigned To</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {allAssets.map(asset => (
                                            <tr key={asset._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                                            {getIcon(asset.category)}
                                                        </div>
                                                        <span className="font-bold text-gray-900 whitespace-nowrap">{asset.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">{asset.serialNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg tracking-wide whitespace-nowrap ${asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : asset.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg">{asset.condition}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                    {asset.assignedTo ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                                                {asset.assignedTo.firstName[0]}{asset.assignedTo.lastName[0]}
                                                            </div>
                                                            <span>{asset.assignedTo.firstName} {asset.assignedTo.lastName}</span>
                                                        </div>
                                                    ) : <span className="text-gray-400 italic">Unassigned</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showNewAssetModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 ring-1 ring-black/5"
                        >
                            <div className="flex justify-between items-center p-6 bg-gray-50/50 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="text-blue-500" /> Add Inventory Item</h2>
                                <button className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-1 transition-colors" onClick={() => setShowNewAssetModal(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateAsset} className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                                    <input
                                        type="text" required className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                        placeholder="e.g. MacBook Air M2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}>
                                            <option value="LAPTOP">Laptop</option>
                                            <option value="MONITOR">Monitor</option>
                                            <option value="MOBILE">Mobile Device</option>
                                            <option value="ACCESSORY">Accessory</option>
                                            <option value="FURNITURE">Furniture</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                        <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newAsset.condition} onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}>
                                            <option value="NEW">New</option>
                                            <option value="GOOD">Good</option>
                                            <option value="FAIR">Fair</option>
                                            <option value="POOR">Poor</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                    <input
                                        type="text" required className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                        value={newAsset.serialNumber} onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                                        placeholder="Enter unique S/N"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8 bg-gray-50 -mx-6 -mb-6 p-6">
                                    <button type="button" onClick={() => setShowNewAssetModal(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all">Save Portfolio</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Assets;
