import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaHome,
    FaCalendarAlt,
    FaUsers,
    FaImages,
    FaCog,
    FaSignOutAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const navigate = useNavigate();

    const menuItems = [
        { path: '/admin/dashboard', name: 'Dashboard', icon: <FaHome /> },
        { path: '/admin/events', name: 'Events', icon: <FaCalendarAlt /> },
        { path: '/admin/leads', name: 'Leads', icon: <FaUsers /> },
        { path: '/admin/templates', name: 'Templates', icon: <FaImages /> },
        { path: '/admin/settings', name: 'Settings', icon: <FaCog /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/admin/login');
    };

    return (
        <div className="h-screen w-64 bg-bg-secondary border-r border-border flex flex-col fixed left-0 top-0 z-50">
            {/* Logo area */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                        P
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-text-main to-text-muted">
                        PosterAdmin
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5'
                                : 'text-text-muted hover:text-text-main hover:bg-text-main/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className={`text-lg ${isActive ? 'text-primary' : 'group-hover:text-text-main'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium relative z-10">{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all group"
                >
                    <FaSignOutAlt className="group-hover:rotate-180 transition-transform duration-300" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
