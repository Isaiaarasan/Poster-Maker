import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    FaArrowLeft, FaSave, FaUpload, FaFont, FaPalette, FaQrcode,
    FaLayerGroup, FaImage, FaTrash, FaPlus, FaCheck, FaDesktop,
    FaMobileAlt, FaCog, FaUsers, FaCamera
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const EventEditor = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('config');
    const [msg, setMsg] = useState('');
    const [saving, setSaving] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        coordinates: {
            // Standard Layout Defaults (1080x1920)
            photo: { x: 540, y: 700, radius: 200, shape: 'square' },
            name: { x: 540, y: 1050 },
            designation: { x: 540, y: 1130 },
            company: { x: 540, y: 1200 },
            email: { x: 540, y: 1270 },
            website: { x: 540, y: 1750 },
            address: { x: 540, y: 1650 }
        },
        typography: {
            fontFamily: 'Outfit',
            name: { size: 70, color: '#000000', weight: 'bold', align: 'center' },
            designation: { size: 40, color: '#000000', weight: 'normal', align: 'center' },
            company: { size: 35, color: '#000000', weight: 'normal', align: 'center' },
            email: { size: 30, color: '#000000', weight: 'normal', align: 'center' },
            website: { size: 30, color: '#000000', weight: 'normal', align: 'center' },
            address: { size: 30, color: '#000000', weight: 'normal', align: 'center' }
        },
        validation: { nameLimit: 30, companyLimit: 50 },
        backgroundImageUrl: '',
        watermarkUrl: '',
        posterElements: {
            // Default Static Content
            website: 'WWW.TECHCONF.COM',
            address: 'ADDRESS',
            time: '', location: '', cta: '', qrEnabled: true
        },
        branding: { colors: ['#ffffff', '#000000', '#8b5cf6'] },
        sponsors: [],
        roles: []
    });

    const [bgFile, setBgFile] = useState(null);
    const [bgPreview, setBgPreview] = useState('');

    // UI States
    const imageRef = useRef(null);
    const [dragging, setDragging] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [newFieldName, setNewFieldName] = useState('');
    const [newRoleName, setNewRoleName] = useState('');

    // Keyboard Navigation for Moving Elements
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedField || !config.coordinates[selectedField]) return;

            // Ignore if typing in an input
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

            const step = e.shiftKey ? 10 : 1;
            let { x, y } = config.coordinates[selectedField];

            switch (e.key) {
                case 'ArrowUp': y -= step; break;
                case 'ArrowDown': y += step; break;
                case 'ArrowLeft': x -= step; break;
                case 'ArrowRight': x += step; break;
                case 'Delete':
                case 'Backspace':
                    if (!['name', 'company', 'designation', 'photo', 'date', 'email', 'website', 'address'].includes(selectedField)) {
                        removeField(selectedField);
                        setSelectedField(null);
                    }
                    break;
                default: return;
            }

            e.preventDefault();
            updateCoordinate(selectedField, x, y);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedField, config]);

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await axios.get(`/api/events/${id}?byId=true`);
            setEvent(res.data);
            if (res.data.config) {
                // Merge defaults to avoid crashes if old data is missing keys
                setConfig(prev => ({ ...prev, ...res.data.config }));
                setBgPreview(res.data.config.backgroundImageUrl);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setMsg('Error fetching event data');
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'bg') {
                setBgFile(file);
                setBgPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        if (bgFile) formData.append('background', bgFile);

        formData.append('coordinates', JSON.stringify(config.coordinates || {}));
        formData.append('typography', JSON.stringify(config.typography || {}));
        formData.append('validation', JSON.stringify(config.validation || {}));
        formData.append('status', event.status || 'draft');
        formData.append('sponsors', JSON.stringify(config.sponsors || []));
        formData.append('roles', JSON.stringify(config.roles || []));
        formData.append('posterElements', JSON.stringify(config.posterElements || {}));
        formData.append('branding', JSON.stringify(config.branding || {}));

        try {
            const res = await axios.put(`/api/events/${id}/config`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEvent(res.data);
            showNotification('Changes saved successfully!');
        } catch (err) {
            showNotification('Error saving changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setMsg(message);
        setTimeout(() => setMsg(''), 3000);
    };

    const updateCoordinate = (key, x, y) => {
        setConfig(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                [key]: { ...prev.coordinates[key], x, y }
            }
        }));
    };

    const handleDragStart = (e, key) => {
        e.dataTransfer.setData("key", key);
        setDragging(key);
        setSelectedField(key);
    };

    const handleCanvasClick = (e) => {
        // If clicking background (not an item), deselect
        if (e.target === imageRef.current || e.target.tagName === 'IMG') {
            setSelectedField(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const scaleX = 1080 / rect.width;
        const scaleY = 1920 / rect.height;

        if (dragging) {
            updateCoordinate(dragging, Math.round(x * scaleX), Math.round(y * scaleY));
            setDragging(null);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    const addCustomField = () => {
        if (!newFieldName.trim()) return;
        const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
        if (config.coordinates[key]) return;

        setConfig(prev => ({
            ...prev,
            coordinates: { ...prev.coordinates, [key]: { x: 540, y: 960 } },
            typography: { ...prev.typography, [key]: { size: 40, color: '#000000', weight: 'bold', align: 'center' } }
        }));
        setNewFieldName('');
        setSelectedField(key);
    };

    const removeField = (key) => {
        if (['name', 'company', 'designation', 'photo', 'date', 'website', 'email', 'address'].includes(key)) {
            alert("Standard fields cannot be removed to ensure template quality.");
            return;
        }
        const newCoords = { ...config.coordinates }; delete newCoords[key];
        const newTypo = { ...config.typography }; delete newTypo[key];
        setConfig(prev => ({ ...prev, coordinates: newCoords, typography: newTypo }));
        if (selectedField === key) setSelectedField(null);
    };

    // Render Logic
    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Loading Editor...</div>;

    return (
        <div className="flex flex-col h-full bg-bg-primary text-text-main overflow-hidden">
            {/* Toolbar Header */}
            <div className="h-16 border-b border-white/5 bg-bg-secondary flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/admin/events" className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{event?.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                            <span>/{event?.slug}</span>
                            <button
                                onClick={() => setEvent({ ...event, status: event.status === 'published' ? 'draft' : 'published' })}
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider transition-all ${event?.status === 'published'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
                                    }`}
                            >
                                {event?.status === 'published' ? '● Published' : '○ Draft'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex bg-black/20 p-1 rounded-lg">
                    {['config', 'leads'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab === 'config' ? 'Design' : 'Data'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {msg && <span className="text-xs text-green-400 animate-pulse">{msg}</span>}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                        {saving ? <FaCog className="animate-spin" /> : <FaSave />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {activeTab === 'config' ? (
                    <>
                        {/* LEFT: Tools Panel */}
                        <div className="w-[400px] bg-bg-secondary border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-8">

                                {/* 1. Assets Upload */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FaImage /> Assets
                                    </h3>
                                    <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Poster Background</label>
                                        <div className="relative group">
                                            <input type="file" onChange={(e) => handleFileChange(e, 'bg')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="flex items-center gap-3 p-3 border border-dashed border-white/10 rounded-lg hover:bg-white/5 transition-colors group-hover:border-primary/50">
                                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-400">
                                                    <FaUpload />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{bgFile ? bgFile.name : 'Upload 1080x1920 Image'}</p>
                                                    <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Layers & Fields */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <FaLayerGroup /> Layers
                                        </h3>
                                        <div className="flex gap-2">
                                            <input
                                                value={newFieldName}
                                                onChange={(e) => setNewFieldName(e.target.value)}
                                                placeholder="New field..."
                                                className="w-24 bg-transparent border-b border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                                                onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                                            />
                                            <button onClick={addCustomField} className="text-primary hover:text-primary-light"><FaPlus /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {Object.keys(config.coordinates).filter(k => k !== 'photo').map(key => {
                                            const style = config.typography[key] || { size: 24, color: '#ffffff' };
                                            return (
                                                <div key={key} className="bg-black/20 border border-white/5 rounded-xl p-4 transition-all hover:border-white/10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-bold text-white capitalize">{key.replace('_', ' ')}</span>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="color"
                                                                value={style.color}
                                                                onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, color: e.target.value } } })}
                                                                className="w-5 h-5 rounded cursor-pointer bg-transparent border-none"
                                                            />
                                                            {!['name', 'company', 'designation', 'photo', 'date', 'email', 'website', 'address'].includes(key) && (
                                                                <button onClick={() => removeField(key)} className="text-slate-500 hover:text-red-500"><FaTrash size={12} /></button>
                                                            )}
                                                        </div>

                                                        {/* If it's a static element (Date, Website), allow editing the text content */}
                                                        {['date', 'website', 'time', 'location', 'cta', 'address'].includes(key) && (
                                                            <div className="mb-3">
                                                                <input
                                                                    type="text"
                                                                    value={config.posterElements?.[key] || ''}
                                                                    onChange={(e) => setConfig({
                                                                        ...config,
                                                                        posterElements: { ...config.posterElements, [key]: e.target.value }
                                                                    })}
                                                                    placeholder={`Enter ${key} text...`}
                                                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                                            <select
                                                                value={style.fontFamily}
                                                                onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, fontFamily: e.target.value } } })}
                                                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                                                            >
                                                                <option value="Outfit">Outfit</option>
                                                                <option value="Inter">Inter</option>
                                                                <option value="Arial">Arial</option>
                                                            </select>
                                                            <select
                                                                value={style.weight || 'normal'}
                                                                onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, weight: e.target.value } } })}
                                                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                                                            >
                                                                <option value="normal">Regular</option>
                                                                <option value="bold">Bold</option>
                                                                <option value="800">Extra Bold</option>
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={style.size}
                                                                onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, size: parseInt(e.target.value) } } })}
                                                                className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                                                placeholder="Size"
                                                            />
                                                            <div className="flex bg-white/5 rounded p-0.5 flex-1">
                                                                {['left', 'center', 'right'].map(align => (
                                                                    <button
                                                                        key={align}
                                                                        onClick={() => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, align } } })}
                                                                        className={`flex-1 py-1 rounded text-[10px] uppercase ${style.align === align ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                                                                    >
                                                                        {align.charAt(0)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* 3. Photo Settings */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FaCamera /> User Photo
                                    </h3>
                                    <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                        <div className="mb-4">
                                            <label className="text-xs text-slate-400 block mb-1">Shape</label>
                                            <div className="flex bg-white/5 rounded-lg p-1">
                                                <button
                                                    onClick={() => setConfig({ ...config, coordinates: { ...config.coordinates, photo: { ...config.coordinates.photo, shape: 'circle' } } })}
                                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${(!config.coordinates.photo?.shape || config.coordinates.photo.shape === 'circle') ? 'bg-primary text-white' : 'text-slate-500'}`}
                                                >
                                                    Circle
                                                </button>
                                                <button
                                                    onClick={() => setConfig({ ...config, coordinates: { ...config.coordinates, photo: { ...config.coordinates.photo, shape: 'square' } } })}
                                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.coordinates.photo?.shape === 'square' ? 'bg-primary text-white' : 'text-slate-500'}`}
                                                >
                                                    Square
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Size (Radius): {config.coordinates.photo?.radius}px</label>
                                            <input
                                                type="range" min="50" max="400"
                                                value={config.coordinates.photo?.radius || 150}
                                                onChange={(e) => setConfig({ ...config, coordinates: { ...config.coordinates, photo: { ...config.coordinates.photo, radius: parseInt(e.target.value) } } })}
                                                className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 4. Branding */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FaPalette /> Branding
                                    </h3>
                                    <div className="flex gap-3">
                                        {config.branding?.colors?.map((color, i) => (
                                            <div key={i} className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:scale-110 transition-transform">
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => {
                                                        const newColors = [...config.branding.colors];
                                                        newColors[i] = e.target.value;
                                                        setConfig({ ...config, branding: { ...config.branding, colors: newColors } });
                                                    }}
                                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                                        <span className="text-sm font-medium text-slate-300 flex items-center gap-2"><FaQrcode /> QR Code</span>
                                        <button
                                            onClick={() => setConfig({ ...config, posterElements: { ...config.posterElements, qrEnabled: !config.posterElements?.qrEnabled } })}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${config.posterElements?.qrEnabled ? 'bg-primary' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.posterElements?.qrEnabled ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </section>

                            </div>
                        </div>

                        {/* CENTER: Canvas Preview */}
                        <div className="flex-1 bg-black relative flex items-center justify-center p-10 overflow-hidden bg-[url('/grid-pattern.svg')]">
                            <div className="absolute top-4 left-4 text-xs font-mono text-white/30">1080 x 1920 • 300 DPI</div>

                            <div
                                className="relative h-full aspect-[9/16] bg-white shadow-2xl overflow-hidden group"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={handleCanvasClick}
                            >
                                {bgPreview ? (
                                    <>
                                        <img src={bgPreview} alt="Background" className="w-full h-full object-cover pointer-events-none" />

                                        {/* Draggable Photo Area */}
                                        {config.coordinates.photo && (
                                            <div
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, 'photo')}
                                                style={{
                                                    top: (config.coordinates.photo.y / 1920) * 100 + '%',
                                                    left: (config.coordinates.photo.x / 1080) * 100 + '%',
                                                    width: (config.coordinates.photo.radius * 2 / 1080 * 100) + '%',
                                                    height: (config.coordinates.photo.radius * 2 / 1080 * 100 * (9 / 16)) + '%',
                                                    borderRadius: config.coordinates.photo.shape === 'square' ? '10%' : '50%'
                                                }}
                                                className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 text-white/50 backdrop-blur-sm cursor-move flex items-center justify-center transition-all ${selectedField === 'photo' ? 'border-primary bg-primary/10' : 'border-dashed border-white/50 bg-black/20'}`}
                                                onClick={(e) => { e.stopPropagation(); setSelectedField('photo'); }}
                                            >
                                                <span className="text-[10px] text-white font-bold tracking-widest opacity-50">PHOTO</span>
                                            </div>
                                        )}

                                        {/* Draggable Text Fields */}
                                        {Object.keys(config.coordinates).filter(k => k !== 'photo').map(key => {
                                            const pos = config.coordinates[key];
                                            const style = config.typography[key] || {};
                                            return (
                                                <div
                                                    key={key}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, key)}
                                                    style={{
                                                        top: (pos.y / 1920) * 100 + '%',
                                                        left: (pos.x / 1080) * 100 + '%',
                                                        transform: `translate(${style.align === 'left' ? '0' : style.align === 'right' ? '-100%' : '-50%'}, -50%)`,
                                                        fontSize: (style.size / 1080 * 100) + 'vw', // Roughly scalable for preview? No, use fixed px scale for editor
                                                        // Actually simpler to just use scale transform on the container but for now assume viewer has enough height
                                                        fontSize: (style.size / 3) + 'px',
                                                        color: style.color,
                                                        fontFamily: style.fontFamily,
                                                        fontWeight: style.weight,
                                                        textAlign: style.align
                                                    }}
                                                    className={`absolute whitespace-nowrap cursor-move border transition-all hover:border-primary/50 px-2 py-1 ${selectedField === key ? 'border-primary bg-primary/10' : 'border-dashed border-transparent'}`}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedField(key); }}
                                                >
                                                    {(() => {
                                                        // Determine display text: Static Content OR Dynamic Placeholder
                                                        let displayText = key.toUpperCase();
                                                        if (['name'].includes(key)) displayText = 'JOHN DOE';
                                                        if (['company'].includes(key)) displayText = 'ACME CORP';
                                                        if (['email'].includes(key)) displayText = 'user@example.com';
                                                        if (['address'].includes(key)) displayText = 'ADDRESS';
                                                        if (config.posterElements?.[key]) displayText = config.posterElements[key];

                                                        return displayText;
                                                    })()}
                                                </div>
                                            );
                                        })}

                                        {/* QR Code */}
                                        {config.posterElements?.qrEnabled && (
                                            <div className="absolute bottom-12 right-12 w-[15%] aspect-square bg-white p-2">
                                                <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px]">QR</div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-neutral-900">
                                        <FaUpload className="text-4xl mb-4 opacity-50" />
                                        <p>Upload a Background Image</p>
                                    </div>
                                )}
                                <img ref={imageRef} src={bgPreview} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="bg-bg-secondary border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaUsers /> Participant Data</h2>
                                <button onClick={() => window.open(`/api/events/${id}/leads`, '_blank')} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm border border-white/10">
                                    Export CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-black/20 text-slate-500 uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="p-4 font-medium">Name</th>
                                            <th className="p-4 font-medium">Mobile</th>
                                            <th className="p-4 font-medium">Role</th>
                                            <th className="p-4 font-medium">Generated Badge</th>
                                            <th className="p-4 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {event.leads?.map((lead, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-bold text-white">{lead.name}</td>
                                                <td className="p-4 font-mono text-xs">{lead.mobile}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded bg-white/5 text-xs border border-white/10">{lead.role || 'Guest'}</span>
                                                </td>
                                                <td className="p-4">
                                                    {lead.generatedPosterUrl ? (
                                                        <a href={lead.generatedPosterUrl} target="_blank" className="text-primary hover:underline">View Badge</a>
                                                    ) : <span className="text-slate-600">-</span>}
                                                </td>
                                                <td className="p-4 text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {(!event.leads?.length) && (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">No leads found yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EventEditor;
