import React, { useState } from 'react';
import { FaUser, FaPalette, FaCreditCard, FaKey, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <FaUser /> },
        { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
        { id: 'billing', label: 'Billing', icon: <FaCreditCard /> },
        { id: 'api', label: 'API Keys', icon: <FaKey /> },
    ];

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs */}
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-slate-400 hover:text-white hover:bg-bg-secondary'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-bg-secondary border border-white/5 rounded-2xl p-8 min-h-[500px]">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">First Name</label>
                                            <input type="text" defaultValue="Admin" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Last Name</label>
                                            <input type="text" defaultValue="User" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Email Address</label>
                                        <input type="email" defaultValue="admin@postermaker.com" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none" />
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                                        >
                                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-white mb-6">Appearance Settings</h2>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-slate-400">Theme Mode</label>
                                        <div className="flex gap-4">
                                            <div className="flex-1 p-4 rounded-xl border-2 border-primary bg-black/40 cursor-pointer relative overflow-hidden">
                                                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full"></div>
                                                <div className="h-20 bg-black/50 rounded mb-2"></div>
                                                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                                                <p className="mt-2 text-center text-sm font-bold text-white">Dark Mode</p>
                                            </div>
                                            <div className="flex-1 p-4 rounded-xl border border-white/10 bg-white cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                                                <div className="h-20 bg-slate-100 rounded mb-2"></div>
                                                <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                                <p className="mt-2 text-center text-sm font-bold text-black">Light Mode</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mt-8">
                                        <label className="text-sm font-medium text-slate-400">Accent Color</label>
                                        <div className="flex gap-3">
                                            {['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'].map(color => (
                                                <div key={color} style={{ backgroundColor: color }} className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-white mb-6">Billing & Subscription</h2>

                                    <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-primary font-bold uppercase tracking-widest text-xs mb-1">Current Plan</p>
                                                    <h3 className="text-3xl font-bold text-white">Pro Enterprise</h3>
                                                </div>
                                                <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">ACTIVE</span>
                                            </div>
                                            <p className="text-slate-300 mb-6 max-w-md">You have unlimited access to all features, including unlimited events, high-res exports, and API access.</p>
                                            <button className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-slate-200">Manage Subscription</button>
                                        </div>
                                        <FaCreditCard className="absolute -bottom-4 -right-4 text-9xl text-white/5 rotate-12" />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white">Payment Method</h3>
                                        <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-black/20">
                                            <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                                                <span className="font-bold text-blue-800 italic">VISA</span>
                                            </div>
                                            <div>
                                                <p className="text-white font-mono">•••• •••• •••• 4242</p>
                                                <p className="text-xs text-slate-500">Expires 12/28</p>
                                            </div>
                                            <button className="ml-auto text-sm text-primary hover:underline">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'api' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-white mb-6">API Configuration</h2>
                                    <p className="text-slate-400 mb-6">Use these keys to authenticate requests from your external applications.</p>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Public API Key</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-primary truncate">
                                                pk_live_51MszJ4KBq8X9J2K...
                                            </code>
                                            <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-white" title="Copy">
                                                <FaSave className="rotate-0" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Secret Key</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-slate-500 truncate">
                                                ********************************
                                            </code>
                                            <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-white" title="Reveal">
                                                <FaEye />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button className="text-red-400 border border-red-500/20 bg-red-500/10 px-4 py-2 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                                            Roll API Keys
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Settings;
