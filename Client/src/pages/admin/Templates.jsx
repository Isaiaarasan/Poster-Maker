import React, { useState } from 'react';
import { FaSearch, FaFilter, FaPlus, FaStar, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Templates = () => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const templates = [
        { id: 1, title: 'Future Tech 2024', category: 'Conference', image: '/templates/tech.png', popular: true },
        { id: 2, title: 'Summer Solstice', category: 'Festival', image: '/templates/music.png', popular: true },
        { id: 3, title: 'Global Summit', category: 'Corporate', image: '/templates/corp.png', popular: false },
        { id: 4, title: 'Startup Pitch', category: 'Business', image: '/templates/tech.png', popular: false }, // Reusing for demo
        { id: 5, title: 'Art Gallery Opening', category: 'Creative', image: '/templates/music.png', popular: false },
        { id: 6, title: 'Annual Report', category: 'Corporate', image: '/templates/corp.png', popular: false },
    ];

    const categories = ['All', 'Conference', 'Festival', 'Corporate', 'Creative'];

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = filter === 'All' || t.category === filter;
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Template Library</h1>
                    <p className="text-slate-400">Choose a starting point for your next event poster.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2">
                        <FaPlus /> Create Blank
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
                        className="group relative aspect-[9/16] bg-black/40 rounded-2xl border border-white/5 overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                    >
                        {/* Image */}
                        <div className="w-full h-full">
                            <img
                                src={template.image}
                                alt={template.title}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                            />
                        </div>

                        {/* Overlay Content */}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <div className="flex items-start justify-between mb-2">
                                <span className="px-2 py-1 rounded-md bg-white/10 text-[10px] uppercase font-bold tracking-wider text-white backdrop-blur-md">
                                    {template.category}
                                </span>
                                {template.popular && (
                                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                        <FaStar /> Popular
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{template.title}</h3>

                            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                <button className="flex-1 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-slate-200">Use Template</button>
                                <button className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20"><FaEye /></button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-500 text-lg">No templates found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};

export default Templates;
