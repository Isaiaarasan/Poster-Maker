import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    const [slug, setSlug] = useState('');
    const navigate = useNavigate();

    const handleGo = (e) => {
        e.preventDefault();
        if (slug.trim()) {
            navigate(`/${slug.trim()}`);
        }
    };

    return (
        <div className="bg-bg-primary min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden text-text-main font-sans">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary opacity-20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary opacity-10 rounded-full blur-[120px]"
                />
            </div>

            <div className="max-w-xl w-full relative z-10">

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-xl mb-6 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        <svg className="w-12 h-12 text-primary relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h1 className="text-6xl font-extrabold mb-4 tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">Poster Maker</span>
                    </h1>
                    <p className="text-xl text-text-muted max-w-md mx-auto font-light">
                        Automated digital identity generation for next-gen events.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="bg-bg-secondary/80 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-3xl p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>

                    <form onSubmit={handleGo} className="space-y-8">
                        <div className="relative mb-6 group">
                            <label className="block text-xs font-semibold tracking-widest uppercase text-text-muted mb-2 group-focus-within:text-primary-light transition-colors">Event Access Code</label>
                            <input
                                type="text"
                                placeholder="enter-event-slug"
                                className="w-full px-5 py-4 bg-bg-tertiary/50 border border-glass-border rounded-2xl text-text-main text-center text-xl tracking-wider font-mono focus:outline-none focus:bg-bg-tertiary focus:border-primary focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all placeholder:text-text-muted/50"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!slug.trim()}
                            className="w-full inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Launch Experience</span>
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-widest">  </span>
                        <button
                            onClick={() => navigate('/admin/login')}
                            className="text-xs text-text-muted hover:text-text-main transition-colors flex items-center gap-1"
                        >
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-6 text-center w-full">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-mono">System v2.0 // Ready</p>
            </div>
        </div>
    );
};

export default Home;
