import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('isAdmin', 'true');
            window.dispatchEvent(new Event("storage"));
            navigate('/admin');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-blue-500 outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:border-blue-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition-colors">
                        Unlock
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full text-gray-500 text-sm hover:text-white"
                    >
                        Back to Public
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
