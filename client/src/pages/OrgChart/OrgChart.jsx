import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../api/axios';
import './OrgChart.css';

const OrgChart = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDirectory();
    }, []);

    const fetchDirectory = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/users'); // Corrected from /directory
            setUsers(res.data.data);
        } catch (error) {
            console.error('Error fetching directory', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Build a hierarchical tree from flat user array
    const buildTree = (flatUsers) => {
        const userMap = new Map();
        const rootNodes = [];

        // Initialize map
        flatUsers.forEach(u => {
            userMap.set(u._id, { ...u, children: [] });
        });

        // Link children to parents
        flatUsers.forEach(u => {
            if (u.managerId && userMap.has(u.managerId)) {
                userMap.get(u.managerId).children.push(userMap.get(u._id));
            } else {
                rootNodes.push(userMap.get(u._id)); // Top-level
            }
        });

        return rootNodes;
    };

    const OrgNode = ({ node }) => {
        return (
            <div className="org-node-container flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="org-card bg-white border border-gray-200 shadow-sm rounded-xl p-4 w-64 flex flex-col items-center text-center relative z-10 hover:shadow-md transition-shadow hover:border-blue-300"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mb-3 shadow-inner">
                        {node.firstName[0]}{node.lastName[0]}
                    </div>
                    <h3 className="text-gray-900 font-bold mb-0.5">{node.firstName} {node.lastName}</h3>
                    <p className="text-sm font-medium text-blue-600 mb-3">{node.designation || 'Employee'}</p>

                    <div className="w-full border-t border-gray-100 pt-3 flex items-center justify-center gap-4 text-gray-500">
                        <a href={`mailto:${node.email}`} title={node.email} className="hover:text-blue-500 transition-colors"><Mail size={16} /></a>
                        <span title={node.role} className="hover:text-blue-500 transition-colors cursor-help"><Users size={16} /></span>
                    </div>
                </motion.div>

                {node.children && node.children.length > 0 && (
                    <div className="org-children-container relative mt-8 flex justify-center gap-12">
                        {/* Vertical line from parent down to horizontal connector */}
                        <div className="absolute top-[-32px] left-1/2 w-0.5 h-8 bg-gray-300 -translate-x-1/2"></div>

                        {/* Horizontal connector line for siblings (only if > 1 child) */}
                        {node.children.length > 1 && (
                            <div className="absolute top-[-4px] left-[50%] right-[50%] h-0.5 bg-gray-300" style={{
                                width: `calc(100% - ${(100 / node.children.length)}% + 2px)`,
                                transform: 'translateX(-50%)'
                            }}></div>
                        )}

                        {node.children.map(child => (
                            <div key={child._id} className="relative">
                                {/* Vertical line down to child */}
                                <div className="absolute top-[-4px] left-1/2 w-0.5 h-4 bg-gray-300 -translate-x-1/2"></div>
                                <OrgNode node={child} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const tree = buildTree(users);

    return (
        <motion.div className="orgchart-page h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-gray-50/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="directory-header bg-white px-8 py-6 border-b border-gray-200 z-20 shadow-sm flex-shrink-0">
                <div>
                    <h1 className="page-title text-2xl font-bold text-gray-900">Company Hierarchy</h1>
                    <p className="page-subtitle text-gray-500">Visual mapping of operational reporting lines across the organization.</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-12 cursor-grab active:cursor-grabbing org-canvas relative">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 rounded-full border-4 border-gray-300 border-t-primary animate-spin"></div>
                    </div>
                ) : (
                    <div className="flex justify-center min-w-max pb-20 pt-10">
                        {tree.map(rootNode => (
                            <OrgNode key={rootNode._id} node={rootNode} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default OrgChart;
