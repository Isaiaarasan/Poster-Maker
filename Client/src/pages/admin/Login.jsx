import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('isAdmin', 'true');
                window.dispatchEvent(new Event("storage"));
                navigate('/admin');
            } else {
                setError('Invalid credentials. Please try again.');
                setLoading(false);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden text-slate-800">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-black opacity-5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-black opacity-5 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-[fadeIn_0.5s_ease-out]">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black shadow-lg shadow-black/20 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-black">Admin Access</h2>
                    <p className="text-slate-500">Sign in to manage your events</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-xl rounded-3xl p-8 relative animate-[slideUp_0.5s_ease-out]">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative">
                            <label className="block text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">Username</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border border-black/10 rounded-2xl text-black focus:outline-none focus:bg-white focus:border-black transition-all disabled:opacity-50"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                autoFocus
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">Password</label>
                            <input
                                type="password"
                                className="w-full px-5 py-4 bg-slate-50 border border-black/10 rounded-2xl text-black focus:outline-none focus:bg-white focus:border-black transition-all disabled:opacity-50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                <p className="text-sm text-red-400 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold bg-black text-white shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">or</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>

                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-slate-500 hover:text-black hover:bg-slate-100 transition-all"
                        disabled={loading}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Home</span>
                    </button>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 rounded-xl bg-white border border-black/5 shadow-sm">
                    <p className="text-xs text-slate-500 text-center mb-2">Demo Credentials</p>
                    <div className="flex justify-center gap-4 text-xs text-slate-600">
                        <span>Username: <code className="text-black bg-slate-100 px-1 rounded">admin</code></span>
                        <span>Password: <code className="text-black bg-slate-100 px-1 rounded">admin123</code></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
