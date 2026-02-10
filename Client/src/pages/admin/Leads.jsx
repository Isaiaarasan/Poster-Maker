import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaDownload, FaTrash } from 'react-icons/fa';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await axios.get('/api/events');
            // Flatten leads from all events
            const allLeads = res.data.flatMap(event =>
                (event.leads || []).map(lead => ({
                    ...lead,
                    eventName: event.title,
                    eventId: event._id
                }))
            );
            // Sort by createdAt desc if available
            setLeads(allLeads);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportCSV = () => {
        const headers = ['Name', 'Role', 'Company', 'Mobile', 'Designation', 'Event', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredLeads.map(l => [
                l.name, l.role, l.company, l.mobile, l.designation, l.eventName, new Date(l.createdAt || Date.now()).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_export.csv';
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Leads</h1>
                    <p className="text-text-muted">Manage and export all your accumulated leads</p>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-xl font-medium text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all"
                >
                    <FaDownload /> Export CSV
                </button>
            </div>

            <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden shadow-xl">
                {/* Toolbar */}
                <div className="p-4 border-b border-border-color flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-color rounded-lg text-text-main focus:outline-none focus:border-primary placeholder:text-text-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-tertiary text-text-muted text-sm uppercase tracking-wider border-b border-border-color">
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Role/Designation</th>
                                <th className="p-4 font-semibold">Company</th>
                                <th className="p-4 font-semibold">Event</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">Loading leads...</td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted">No leads found.</td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead, idx) => (
                                    <tr key={idx} className="hover:bg-text-main/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {lead.photoUrl ? (
                                                    <img src={lead.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border-color" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
                                                        {lead.name?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-text-main">{lead.name}</div>
                                                    <div className="text-xs text-text-muted">{lead.mobile}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-text-main">{lead.designation}</div>
                                            <div className="text-xs text-primary/80">{lead.role}</div>
                                        </td>
                                        <td className="p-4 text-text-main">{lead.company}</td>
                                        <td className="p-4 text-text-main">{lead.eventName}</td>
                                        <td className="p-4 text-right">
                                            <button className="text-text-muted hover:text-red-400 p-2 rounded-lg hover:bg-text-main/10 transition-colors">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leads;
