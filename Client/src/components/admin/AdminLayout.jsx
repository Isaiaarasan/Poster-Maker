import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-bg-primary text-text-main font-sans">
            <Sidebar />
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                {/* Header or Breadcrumbs could go here */}
                <div className="max-w-7xl mx-auto animate-fadeIn">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
