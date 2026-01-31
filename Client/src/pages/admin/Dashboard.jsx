import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/admin/login');
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-slate-100 text-slate-500 border-slate-200',
            published: 'bg-green-50 text-green-600 border-green-200',
            archived: 'bg-gray-100 text-gray-500 border-gray-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.draft}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-bg-primary text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-black/5 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-black/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-black">Event Dashboard</h1>
                                <p className="text-xs text-slate-500">Manage your poster events</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-black hover:bg-slate-100 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Total Events</p>
                                <p className="text-3xl font-bold text-black">{events.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
                                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Published</p>
                                <p className="text-3xl font-bold text-black">{events.filter(e => e.status === 'published').length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Total Leads</p>
                                <p className="text-3xl font-bold text-black">{events.reduce((acc, e) => acc + (e.leads?.length || 0), 0)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
                                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Section */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-black">Your Events</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 rounded-xl font-bold bg-black text-white shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Event
                    </button>
                </div>

                {/* Events List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-white border border-black/5 rounded-2xl p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-black/5 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-black">No events yet</h3>
                        <p className="text-slate-500 mb-6">Create your first event to get started</p>
                        <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 rounded-xl font-bold bg-black text-white shadow-lg shadow-black/10 hover:bg-neutral-800">
                            Create Your First Event
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <div key={event._id} className="bg-white border border-black/5 rounded-2xl p-6 cursor-pointer hover:border-black/20 hover:shadow-lg transition-all" onClick={() => navigate(`/admin/event/${event._id}`)}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1 text-black">{event.title}</h3>
                                        <p className="text-sm text-slate-500">/{event.slug}</p>
                                    </div>
                                    {getStatusBadge(event.status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>{event.leads?.length || 0} leads</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-black/5 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[slideUp_0.3s_ease-out]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-black">Create New Event</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-black/5 text-slate-500 hover:text-black transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="relative">
                                <label className="block text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">Event Title</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3 bg-slate-50 border border-black/10 rounded-xl text-black focus:outline-none focus:bg-white focus:border-black transition-all"
                                    placeholder="e.g., Tech Summit 2026"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-semibold tracking-widest uppercase text-slate-500 mb-2">URL Slug</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3 bg-slate-50 border border-black/10 rounded-xl text-black focus:outline-none focus:bg-white focus:border-black transition-all"
                                    placeholder="e.g., tech-summit-2026"
                                    value={newEvent.slug}
                                    onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Public URL: <span className="text-black">/{newEvent.slug || 'your-slug'}</span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-black/10 text-slate-500 hover:text-black hover:bg-black/5 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating} className="flex-1 px-4 py-3 rounded-xl font-bold bg-black text-white hover:bg-neutral-800 transition-all disabled:opacity-50">
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
