import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaEye, FaCopy } from 'react-icons/fa';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Events</h1>
                    <p className="text-slate-400">Manage your poster generation campaigns</p>
                </div>
                <button
                    onClick={() => navigate('/admin/dashboard')} // Dashboard has the create modal
                    className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                >
                    <FaPlus /> Create Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                    <div
                        key={event._id}
                        className="group bg-bg-secondary border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/event/${event._id}`) }} className="p-2 bg-white/10 rounded-lg text-white hover:bg-primary"><FaEdit /></button>
                            <button onClick={(e) => { e.stopPropagation(); window.open(`/${event.slug}`, '_blank') }} className="p-2 bg-white/10 rounded-lg text-white hover:bg-primary"><FaEye /></button>
                        </div>

                        <div className="mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${event.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                {event.status || 'Draft'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">/{event.slug}</p>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                            <div className="text-center">
                                <div className="text-lg font-bold text-white">{event.leads?.length || 0}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Leads</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-white">{new Date(event.createdAt).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Created</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Events;
