import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaUsers, FaChartLine, FaCalendarCheck } from 'react-icons/fa';

const Dashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', slug: '' });
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get('/api/events');
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await axios.post('/api/events', newEvent);
            navigate(`/admin/event/${res.data._id}`);
        } catch (err) {
            alert('Error creating event: ' + (err.response?.data?.message || err.message));
            setCreating(false);
        }
    };

    const stats = [
        {
            label: 'Total Events',
            value: events.length,
            icon: <FaCalendarCheck />,
            color: 'from-blue-500 to-cyan-400',
            bg: 'bg-blue-500/10 text-blue-400'
        },
        {
            label: 'Total Leads',
            value: events.reduce((acc, e) => acc + (e.leads?.length || 0), 0),
            icon: <FaUsers />,
            color: 'from-purple-500 to-pink-400',
            bg: 'bg-purple-500/10 text-purple-400'
        },
        {
            label: 'Published',
            value: events.filter(e => e.status === 'published').length,
            icon: <FaChartLine />,
            color: 'from-green-500 to-emerald-400',
            bg: 'bg-green-500/10 text-green-400'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Here's what's happening with your events today.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                >
                    <FaPlus /> Create New Event
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card-glass rounded-2xl p-6 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 opacity-50 text-6xl group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                            {stat.icon}
                        </div>
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center text-xl mb-4`}>
                                {stat.icon}
                            </div>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-4xl font-bold text-white mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Events Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Recent Events</h2>
                    <button onClick={() => navigate('/admin/events')} className="text-sm text-primary hover:text-white transition-colors">View All</button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-slate-400 mb-4">No events found</p>
                        <button onClick={() => setShowCreateModal(true)} className="text-primary hover:underline">Create your first event</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.slice(0, 3).map(event => (
                            <div
                                key={event._id}
                                onClick={() => navigate(`/admin/event/${event._id}`)}
                                className="bg-bg-secondary border border-white/5 rounded-2xl p-5 hover:border-primary/50 cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-white font-bold">
                                        {event.title.charAt(0)}
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${event.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {event.status || 'Draft'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{event.title}</h3>
                                <p className="text-sm text-slate-500 mb-4">/{event.slug}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><FaUsers /> {event.leads?.length || 0} Leads</span>
                                    <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[fadeIn_0.3s_ease-out]">
                        <h3 className="text-2xl font-bold text-white mb-6">Create New Event</h3>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">Event Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                    placeholder="e.g., Tech Summit 2026"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">URL Slug</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                    placeholder="e.g., tech-summit-2026"
                                    value={newEvent.slug}
                                    onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating} className="flex-1 px-4 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition-all disabled:opacity-50">
                                    {creating ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
