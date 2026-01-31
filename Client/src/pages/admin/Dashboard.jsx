import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
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
        }
    };

    const handleCreate = async () => {
        const title = prompt('Event Title:');
        if (!title) return;
        const slug = prompt('Event Slug (unique URL part, e.g. /event2024):');
        if (!slug) return;

        try {
            const res = await axios.post('/api/events', { title, slug });
            navigate(`/admin/event/${res.data._id}`);
        } catch (err) {
            alert('Error creating event: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="admin-dashboard fade-in">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Event Lifecycle Management</h1>
                    <p className="text-gray-400">Manage your events, templates, and leads.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                    }}
                >
                    + Create New Event
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {events.map(event => (
                    <div key={event._id} className="card bg-gray-800 p-6 rounded-xl hover:shadow-xl transition-all border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${event.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                    event.status === 'archived' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {event.status}
                            </span>
                            <span className="text-gray-500 text-sm">
                                {new Date(event.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <p className="text-gray-400 mb-4 font-mono text-sm">/{event.slug}</p>

                        <Link
                            to={`/admin/event/${event._id}`}
                            className="block w-full text-center py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                        >
                            Manage Configuration
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
