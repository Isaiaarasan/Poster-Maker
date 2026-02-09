import React, { useState } from 'react';
import { FaSearch, FaFilter, FaPlus, FaStar, FaEye, FaCopy, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Templates = () => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const templates = [
        { id: 'tech-conf', title: 'Tech Conference', category: 'Conference', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80', popular: true, config: { branding: { colors: ['#0f172a', '#3b82f6', '#60a5fa'] } } },
        { id: 'music-fest', title: 'Summer Festival', category: 'Festival', image: 'https://images.unsplash.com/photo-1459749411177-0473ef716603?w=400&q=80', popular: true, config: { branding: { colors: ['#4c1d95', '#d946ef', '#f472b6'] } } },
        { id: 'corp-summit', title: 'Global Summit', category: 'Corporate', image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=80', popular: false, config: { branding: { colors: ['#1e293b', '#94a3b8', '#cbd5e1'] } } },
        { id: 'startup-pitch', title: 'Startup Pitch', category: 'Business', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80', popular: false, config: { branding: { colors: ['#111827', '#10b981', '#34d399'] } } },
        { id: 'art-gala', title: 'Art Gala', category: 'Creative', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80', popular: false, config: { branding: { colors: ['#000000', '#f59e0b', '#fbbf24'] } } },
        { id: 'annual-report', title: 'Annual Report', category: 'Corporate', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80', popular: false, config: { branding: { colors: ['#1e1b4b', '#6366f1', '#818cf8'] } } },
    ];

    const categories = ['All', 'Conference', 'Festival', 'Corporate', 'Creative', 'Business'];

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = filter === 'All' || t.category === filter;
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const createEvent = async (templateConfig = null, titlePrefix = 'Untitled Event') => {
        setCreating(true);
        try {
            const res = await axios.post('/api/events', {
                title: `${titlePrefix} ${new Date().toLocaleDateString()}`,
                slug: `event-${Date.now()}`, // Simple unique slug
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000),
            });

            if (templateConfig) {
                // Apply template config if provided
                await axios.put(`/api/events/${res.data._id}/config`, {
                    branding: JSON.stringify(templateConfig.branding)
                });
            }

            navigate(`/admin/event/${res.data._id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create event");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Template Library</h1>
                    <p className="text-slate-400">Choose a starting point for your next event poster.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => createEvent()}
                        disabled={creating}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2 hover:scale-105"
                    >
                        {creating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                        Create Blank
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 bg-bg-secondary p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/20 text-white pl-12 pr-4 py-3 rounded-xl border border-white/5 focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === cat ? 'bg-white text-black' : 'bg-black/20 text-slate-400 hover:text-white'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative aspect-[9/16] bg-black/40 rounded-2xl border border-white/5 overflow-hidden hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
                    >
                        {/* Image */}
                        <div className="w-full h-full relative">
                            <img
                                src={template.image}
                                alt={template.title}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                        </div>

                        {/* Overlay Content */}
                        <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-start justify-between mb-2">
                                <span className="px-2 py-1 rounded-md bg-white/10 text-[10px] uppercase font-bold tracking-wider text-white backdrop-blur-md">
                                    {template.category}
                                </span>
                                {template.popular && (
                                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-1 rounded">
                                        <FaStar /> Popular
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{template.title}</h3>

                            <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                <button
                                    onClick={() => createEvent(template.config, template.title)}
                                    className="py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaCopy size={12} /> Use
                                </button>
                                <button className="py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                    <FaEye size={12} /> Preview
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-slate-500 text-lg">No templates found matching your criteria.</p>
                    <button onClick={() => setFilter('All')} className="mt-4 text-primary hover:underline">Clear Filters</button>
                </div>
            )}
        </div>
    );
};

export default Templates;
