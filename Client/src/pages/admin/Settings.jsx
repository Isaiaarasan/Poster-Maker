import React, { useState } from 'react';
import { FaUser, FaPalette, FaCreditCard, FaKey, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    // Load initial state or defaults
    const [settings, setSettings] = useState({
        appName: localStorage.getItem('pm_appName') || 'Poster Maker',
        supportEmail: localStorage.getItem('pm_supportEmail') || 'support@example.com',
        primaryColor: localStorage.getItem('pm_primaryColor') || '#8b5cf6',
        themeMode: localStorage.getItem('pm_themeMode') || 'dark',
        privacyUrl: localStorage.getItem('pm_privacyUrl') || '',
        termsUrl: localStorage.getItem('pm_termsUrl') || ''
    });

    const tabs = [
        { id: 'general', label: 'General', icon: <FaUser /> },
        { id: 'defaults', label: 'Appearance', icon: <FaPalette /> },
        { id: 'legal', label: 'Legal & Privacy', icon: <FaKey /> },
    ];

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        // Real-time preview
        if (key === 'primaryColor') {
            document.documentElement.style.setProperty('--primary', value);
        }
        if (key === 'themeMode') {
            if (value === 'light') document.documentElement.classList.add('light');
            else document.documentElement.classList.remove('light');
        }
    };

    const handleSave = () => {
        setLoading(true);
        // Persist to localStorage
        Object.keys(settings).forEach(key => {
            localStorage.setItem(`pm_${key}`, settings[key]);
        });

        setTimeout(() => {
            setLoading(false);
            // alert("Settings saved successfully!"); // Removed alert for smoother experience
        }, 800);
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-text-main mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs */}
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-400 hover:text-text-main hover:bg-bg-secondary'
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
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-text-main mb-6">General Information</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Application Name</label>
                                            <input
                                                type="text"
                                                value={settings.appName}
                                                onChange={(e) => handleChange('appName', e.target.value)}
                                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Support Email</label>
                                            <input
                                                type="email"
                                                value={settings.supportEmail}
                                                onChange={(e) => handleChange('supportEmail', e.target.value)}
                                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                                        >
                                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'defaults' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-text-main mb-6">Appearance & Branding</h2>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-slate-400">Theme Mode</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleChange('themeMode', 'dark')}
                                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${settings.themeMode === 'dark' ? 'border-primary bg-bg-tertiary' : 'border-transparent bg-bg-tertiary opacity-50 hover:opacity-100'}`}
                                            >
                                                <div className="flex justify-center mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700"></div>
                                                </div>
                                                <p className={`text-center text-sm font-bold ${settings.themeMode === 'dark' ? 'text-primary' : 'text-slate-400'}`}>Dark Mode</p>
                                            </button>
                                            <button
                                                onClick={() => handleChange('themeMode', 'light')}
                                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${settings.themeMode === 'light' ? 'border-primary bg-slate-100' : 'border-transparent bg-slate-100 opacity-50 hover:opacity-100'}`}
                                            >
                                                <div className="flex justify-center mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200"></div>
                                                </div>
                                                <p className={`text-center text-sm font-bold ${settings.themeMode === 'light' ? 'text-primary' : 'text-slate-500'}`}>Light Mode</p>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <label className="text-sm font-medium text-slate-400">Admin Accent Color</label>
                                        <p className="text-xs text-slate-500 mb-2">Controls buttons, active states, and highlights.</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl border border-white/20 shadow-lg" style={{ backgroundColor: settings.primaryColor }}></div>
                                            <input
                                                type="color"
                                                value={settings.primaryColor}
                                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                                className="bg-transparent border border-white/10 rounded cursor-pointer w-32 h-10 px-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                                        >
                                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'legal' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-text-main mb-6">Legal & Privacy</h2>
                                    <p className="text-slate-400 text-sm mb-4">Configure links that appear in the generated posters or footers.</p>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Privacy Policy URL</label>
                                            <input
                                                type="url"
                                                value={settings.privacyUrl}
                                                onChange={(e) => handleChange('privacyUrl', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Terms of Service URL</label>
                                            <input
                                                type="url"
                                                value={settings.termsUrl}
                                                onChange={(e) => handleChange('termsUrl', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleSave}
                                            className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                                        >
                                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
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
