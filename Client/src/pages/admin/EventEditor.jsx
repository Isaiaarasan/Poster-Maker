import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    FaSave, FaArrowLeft, FaMobileAlt, FaImage, FaFont, FaPalette, FaLayerGroup,
    FaPlus, FaTrash, FaUndo, FaRedo, FaSearchPlus, FaSearchMinus, FaCompress,
    FaMagnet, FaAlignLeft, FaAlignCenter, FaAlignRight, FaCog, FaCamera, FaUpload, FaUsers, FaQrcode, FaCheckCircle, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const EventEditor = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [activeTab, setActiveTab] = useState('config'); // config | leads

    // Editor State
    const [selectedField, setSelectedField] = useState(null);
    const [bgFile, setBgFile] = useState(null);
    const [bgPreview, setBgPreview] = useState(null);
    const [zoom, setZoom] = useState(0.4); // Initial default zoom
    const [showGrid, setShowGrid] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const imageRef = useRef(null);

    // Accordion State
    const [openSections, setOpenSections] = useState({
        assets: true,
        layers: true,
        photo: false,
        branding: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const [config, setConfig] = useState({
        coordinates: {
            photo: { x: 540, y: 960, radius: 150, shape: 'circle' }, // Center photo
        },
        typography: {},
        validation: {}, // required fields
        posterElements: {
            // Default Static Content
            website: 'WWW.TECHCONF.COM',
            address: 'ADDRESS',
            time: '', location: '', cta: '', qrEnabled: true, qrSize: 250
        },
        branding: { colors: ['#ffffff', '#000000', '#8b5cf6'] },
        sponsors: [],
        roles: [],
        formFields: {}
    });

    const [newFieldName, setNewFieldName] = useState('');
    const [dragging, setDragging] = useState(null);

    // History Management
    useEffect(() => {
        if (history.length === 0 && config) {
            setHistory([JSON.stringify(config)]);
            setHistoryIndex(0);
        }
    }, [loading]);

    // Auto-save history on config change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (history[historyIndex] !== JSON.stringify(config)) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(JSON.stringify(config));
                if (newHistory.length > 20) newHistory.shift(); // Limit history
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [config]);

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = JSON.parse(history[historyIndex - 1]);
            setConfig(prevState);
            setHistoryIndex(prev => prev - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = JSON.parse(history[historyIndex + 1]);
            setConfig(nextState);
            setHistoryIndex(prev => prev + 1);
        }
    };

    // Auto-Fit Zoom on Load
    useEffect(() => {
        // Wait a bit for layout to settle
        const timer = setTimeout(() => {
            const container = document.getElementById('canvas-container');
            if (container) {
                const padding = 80; // Padding around the canvas
                const w = container.clientWidth - padding;
                const h = container.clientHeight - padding;
                // Calculate scale to fit 1080x1600 into available space
                const optimal = Math.min(w / 1080, h / 1600);
                setZoom(Math.max(0.2, Math.min(1.5, optimal))); // Clamp between 0.2 and 1.5
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [loading, activeTab]);

    useEffect(() => {
        // Keyboard shortcuts for nudging
        const handleKeyDown = (e) => {
            if (!selectedField || !config.coordinates[selectedField]) return;
            // Only if not typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            const { x, y } = config.coordinates[selectedField];
            const shift = e.shiftKey ? 10 : 1;

            switch (e.key) {
                case 'ArrowUp': updateCoordinate(selectedField, x, y - shift); break;
                case 'ArrowDown': updateCoordinate(selectedField, x, y + shift); break;
                case 'ArrowLeft': updateCoordinate(selectedField, x - shift, y); break;
                case 'ArrowRight': updateCoordinate(selectedField, x + shift, y); break;
                case 'Delete':
                case 'Backspace':
                    if (!['name', 'company', 'photo'].includes(selectedField)) {
                        removeField(selectedField);
                    }
                    break;
                default: return;
            }

            e.preventDefault();
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
        formData.append('formFields', JSON.stringify(config.formFields || {}));

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
        const scaleY = 1600 / rect.height;

        if (dragging) {
            updateCoordinate(dragging, Math.round(x * scaleX), Math.round(y * scaleY));
            setDragging(null);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    const applyStandardLayout = () => {
        if (!window.confirm("This will reset all positions to the standard vertical stack. Continue?")) return;

        setConfig(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                photo: { x: 540, y: 450, radius: 180, shape: 'circle' },
                name: { x: 540, y: 1000 },
                designation: { x: 540, y: 1100 },
                company: { x: 540, y: 1200 },
                email: { x: 540, y: 1300 },
                website: { x: 540, y: 1400 },
                mobile: { x: 540, y: 1500 },
                address: { x: 540, y: 1750 }
            },
            typography: {
                ...prev.typography,
                name: { ...prev.typography.name, align: 'center', size: 65, weight: 'bold' },
                designation: { ...prev.typography.designation, align: 'center', size: 40, weight: 'normal' },
                company: { ...prev.typography.company, align: 'center', size: 35, weight: 'normal' },
                email: { ...prev.typography.email, align: 'center', size: 30, weight: 'normal' },
                website: { ...prev.typography.website, align: 'center', size: 30, weight: 'normal' },
                mobile: { ...prev.typography.mobile, align: 'center', size: 30, weight: 'normal' }
            },
            formFields: {
                ...prev.formFields,
                name: { label: 'Full Name', required: true, placeholder: 'e.g. John Doe' },
                email: { label: 'Email Address', required: true, placeholder: 'john@example.com' },
                company: { label: 'Company Name', required: true, placeholder: 'e.g. Acme Corp' },
                designation: { label: 'Job Title', required: true, placeholder: 'e.g. CEO' },
                mobile: { label: 'Mobile Number', required: true, placeholder: '+91 98765 43210' },
                website: { label: 'Website', required: false, placeholder: 'www.yoursite.com' }
            }
        }));
    };

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
            <div className="h-16 border-b border-border-color bg-bg-secondary flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/admin/events" className="p-2 hover:bg-text-main/5 rounded-full text-text-muted hover:text-text-main transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg leading-tight text-text-main">{event?.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-text-muted font-mono mt-1">
                            <span>/{event?.slug}</span>
                            <button
                                onClick={() => setEvent({ ...event, status: event.status === 'published' ? 'draft' : 'published' })}
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider transition-all ${event?.status === 'published'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
                                    }`}
                            >
                                {event?.status === 'published' ? '● Published' : '○ Draft'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex bg-bg-tertiary p-1 rounded-lg border border-border-color">
                    {['config', 'leads'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-bg-primary text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                        >
                            {tab === 'config' ? 'Design' : 'Data'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {msg && <span className="text-xs text-green-500 animate-pulse">{msg}</span>}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-text-main text-bg-primary rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
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
                        {/* LEFT: Tools Panel (Accordion) */}
                        <div className="w-[360px] bg-bg-secondary border-r border-border-color flex flex-col z-20 shadow-xl">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">

                                {/* 1. ASSETS */}
                                <div className="bg-bg-tertiary rounded-xl overflow-hidden border border-border-color">
                                    <button onClick={() => toggleSection('assets')} className="w-full flex items-center justify-between p-4 hover:bg-text-main/5 transition-colors">
                                        <span className="font-bold text-sm text-text-main flex items-center gap-2"><FaImage className="text-primary" /> Assets</span>
                                        {openSections.assets ? <FaChevronUp className="text-xs opacity-50 text-text-muted" /> : <FaChevronDown className="text-xs opacity-50 text-text-muted" />}
                                    </button>
                                    <AnimatePresence>
                                        {openSections.assets && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="p-4 pt-0">
                                                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Background</label>
                                                    <div className="relative group cursor-pointer">
                                                        <input id="bg-upload" type="file" onChange={(e) => handleFileChange(e, 'bg')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                        <div className="flex items-center gap-3 p-3 border border-dashed border-border-color rounded-xl hover:bg-text-main/5 transition-all group-hover:border-primary/50 bg-bg-primary">
                                                            <div className="w-12 h-12 bg-bg-tertiary border border-border-color rounded-lg flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                                                                <FaUpload />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-text-main truncate">{bgFile ? bgFile.name : 'Click to Upload'}</p>
                                                                <p className="text-[10px] text-text-muted">1080x1600 (27:40)</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 2. LAYERS */}
                                <div className="bg-bg-tertiary rounded-xl overflow-hidden border border-border-color">
                                    <button onClick={() => toggleSection('layers')} className="w-full flex items-center justify-between p-4 hover:bg-text-main/5 transition-colors">
                                        <span className="font-bold text-sm text-text-main flex items-center gap-2"><FaLayerGroup className="text-blue-400" /> Layers & Fields</span>
                                        {openSections.layers ? <FaChevronUp className="text-xs opacity-50 text-text-muted" /> : <FaChevronDown className="text-xs opacity-50 text-text-muted" />}
                                    </button>
                                    <AnimatePresence>
                                        {openSections.layers && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="p-4 pt-0 space-y-4">

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={applyStandardLayout}
                                                            className="flex-1 text-[10px] bg-bg-primary hover:bg-text-main/5 py-2 rounded text-text-muted border border-border-color transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <FaMobileAlt /> Reset Layout
                                                        </button>
                                                        <div className="flex flex-1 relative">
                                                            <input
                                                                value={newFieldName}
                                                                onChange={(e) => setNewFieldName(e.target.value)}
                                                                placeholder="Add Field..."
                                                                className="w-full bg-bg-primary border border-border-color rounded-l pl-2 text-xs text-text-main focus:outline-none focus:border-primary"
                                                                onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                                                            />
                                                            <button onClick={addCustomField} className="px-3 bg-primary text-white rounded-r hover:bg-primary-light"><FaPlus /></button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {Object.keys(config.coordinates).filter(k => k !== 'photo').map(key => {
                                                            const style = config.typography[key] || { size: 24, color: '#ffffff' };
                                                            const isSelected = selectedField === key;
                                                            return (
                                                                <div
                                                                    key={key}
                                                                    className={`group border rounded-lg p-3 transition-all cursor-pointer ${isSelected ? 'bg-primary/10 border-primary' : 'bg-bg-primary border-border-color hover:border-text-main/20'}`}
                                                                    onClick={() => setSelectedField(key)}
                                                                >
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-slate-500'}`}></span>
                                                                            <span className="text-sm font-bold text-text-main capitalize">{key.replace('_', ' ')}</span>
                                                                        </div>
                                                                        {!['name', 'company', 'designation', 'photo', 'date', 'email', 'website', 'address'].includes(key) && (
                                                                            <button onClick={(e) => { e.stopPropagation(); removeField(key); }} className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><FaTrash size={10} /></button>
                                                                        )}
                                                                    </div>

                                                                    {/* Expanded Controls for Selected Item */}
                                                                    {isSelected && (
                                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2 border-t border-border-color">

                                                                            {/* FORM CONFIGURATION */}
                                                                            <div className="bg-bg-secondary p-2 rounded mb-2 border border-border-color">
                                                                                <p className="text-[10px] uppercase font-bold text-text-muted mb-2">Form Settings</p>
                                                                                <div className="space-y-2">
                                                                                    <div>
                                                                                        <label className="text-[10px] text-text-muted">Label</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={config.formFields?.[key]?.label || key.replace('_', ' ')}
                                                                                            onChange={(e) => setConfig({
                                                                                                ...config,
                                                                                                formFields: { ...config.formFields, [key]: { ...(config.formFields?.[key] || {}), label: e.target.value } }
                                                                                            })}
                                                                                            className="w-full bg-bg-primary border border-border-color rounded px-2 py-1 text-xs text-text-main focus:border-primary outline-none"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] text-text-muted">Placeholder</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={config.formFields?.[key]?.placeholder || ''}
                                                                                            onChange={(e) => setConfig({
                                                                                                ...config,
                                                                                                formFields: { ...config.formFields, [key]: { ...(config.formFields?.[key] || {}), placeholder: e.target.value } }
                                                                                            })}
                                                                                            placeholder={`Enter ${key}...`}
                                                                                            className="w-full bg-bg-primary border border-border-color rounded px-2 py-1 text-xs text-text-main focus:border-primary outline-none"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            id={`req-${key}`}
                                                                                            checked={config.formFields?.[key]?.required || false}
                                                                                            onChange={(e) => setConfig({
                                                                                                ...config,
                                                                                                formFields: { ...config.formFields, [key]: { ...(config.formFields?.[key] || {}), required: e.target.checked } }
                                                                                            })}
                                                                                            className="accent-primary"
                                                                                        />
                                                                                        <label htmlFor={`req-${key}`} className="text-xs text-text-muted">Required Field</label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {['date', 'website', 'time', 'location', 'cta', 'address'].includes(key) && (
                                                                                <div>
                                                                                    <label className="text-[10px] text-text-muted uppercase">Static Content</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={config.posterElements?.[key] || ''}
                                                                                        onChange={(e) => setConfig({ ...config, posterElements: { ...config.posterElements, [key]: e.target.value } })}
                                                                                        placeholder="Content..."
                                                                                        className="w-full bg-bg-primary border border-border-color rounded px-2 py-1.5 text-xs text-text-main mb-2 focus:border-primary outline-none"
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <label className="text-[10px] text-text-muted uppercase">Font</label>
                                                                                    <select
                                                                                        value={style.fontFamily}
                                                                                        onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, fontFamily: e.target.value } } })}
                                                                                        className="w-full bg-bg-primary border border-border-color rounded px-2 py-1 text-xs text-text-muted outline-none"
                                                                                    >
                                                                                        <option value="Outfit">Outfit</option>
                                                                                        <option value="Inter">Inter</option>
                                                                                        <option value="Arial">Arial</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[10px] text-text-muted uppercase">Weight</label>
                                                                                    <select
                                                                                        value={style.weight || 'normal'}
                                                                                        onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, weight: e.target.value } } })}
                                                                                        className="w-full bg-bg-primary border border-border-color rounded px-2 py-1 text-xs text-text-muted outline-none"
                                                                                    >
                                                                                        <option value="normal">Reg</option>
                                                                                        <option value="bold">Bold</option>
                                                                                        <option value="800">Black</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex gap-2 items-center">
                                                                                <input
                                                                                    type="color"
                                                                                    value={style.color}
                                                                                    onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, color: e.target.value } } })}
                                                                                    className="w-8 h-6 rounded cursor-pointer bg-transparent border border-border-color"
                                                                                />
                                                                                <input
                                                                                    type="number"
                                                                                    value={style.size}
                                                                                    onChange={(e) => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, size: parseInt(e.target.value) } } })}
                                                                                    className="w-16 bg-bg-primary border border-border-color rounded px-2 py-1 text-xs text-text-main text-center"
                                                                                />
                                                                                <div className="flex bg-bg-primary rounded border border-border-color p-0.5 flex-1">
                                                                                    {['left', 'center', 'right'].map(align => (
                                                                                        <button
                                                                                            key={align}
                                                                                            onClick={() => setConfig({ ...config, typography: { ...config.typography, [key]: { ...style, align } } })}
                                                                                            className={`flex-1 py-1 rounded text-[10px] ${style.align === align ? 'bg-text-main/20 text-text-main' : 'text-text-muted hover:text-text-main'}`}
                                                                                        >
                                                                                            {align === 'left' && <FaAlignLeft />}
                                                                                            {align === 'center' && <FaAlignCenter />}
                                                                                            {align === 'right' && <FaAlignRight />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 3. PHOTO SETTINGS */}
                                <div className="bg-bg-tertiary rounded-xl overflow-hidden border border-border-color">
                                    <button onClick={() => toggleSection('photo')} className="w-full flex items-center justify-between p-4 hover:bg-text-main/5 transition-colors">
                                        <span className="font-bold text-sm text-text-main flex items-center gap-2"><FaCamera className="text-purple-400" /> Photo Settings</span>
                                        {openSections.photo ? <FaChevronUp className="text-xs opacity-50 text-text-muted" /> : <FaChevronDown className="text-xs opacity-50 text-text-muted" />}
                                    </button>
                                    <AnimatePresence>
                                        {openSections.photo && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="p-4 pt-0">
                                                    <div className="mb-4">
                                                        <label className="text-xs font-bold text-text-muted block mb-2 uppercase">Shape</label>
                                                        <div className="flex bg-bg-primary rounded-lg p-1 border border-border-color">
                                                            <button
                                                                onClick={() => setConfig({ ...config, coordinates: { ...config.coordinates, photo: { ...config.coordinates.photo, shape: 'circle' } } })}
                                                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${(!config.coordinates.photo?.shape || config.coordinates.photo.shape === 'circle') ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}
                                                            >
                                                                Circle
                                                            </button>
                                                            <button
                                                                onClick={() => setConfig({ ...config, coordinates: { ...config.coordinates, photo: { ...config.coordinates.photo, shape: 'square' } } })}
                                                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.coordinates.photo?.shape === 'square' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}
                                                            >
                                                                Square
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-text-muted block mb-2 uppercase flex justify-between">
                                                            <span>Size (Radius)</span>
                                                            <span className="text-text-main">{config.coordinates.photo?.radius}px</span>
                                                        </label>
                                                        <input
                                                            type="range" min="50" max="400"
                                                            value={config.coordinates.photo?.radius || 150}
                                                            onChange={(e) => setConfig({ ...config, coordinates: { ...config.coordinates, photo: { ...config.coordinates.photo, radius: parseInt(e.target.value) } } })}
                                                            className="w-full accent-primary cursor-pointer bg-transparent py-2"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 4. BRANDING */}
                                <div className="bg-bg-tertiary rounded-xl overflow-hidden border border-border-color">
                                    <button onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between p-4 hover:bg-text-main/5 transition-colors">
                                        <span className="font-bold text-sm text-text-main flex items-center gap-2"><FaPalette className="text-pink-400" /> Branding</span>
                                        {openSections.branding ? <FaChevronUp className="text-xs opacity-50 text-text-muted" /> : <FaChevronDown className="text-xs opacity-50 text-text-muted" />}
                                    </button>
                                    <AnimatePresence>
                                        {openSections.branding && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="p-4 pt-0">
                                                    <div className="flex gap-3 mb-4">
                                                        {config.branding?.colors?.map((color, i) => (
                                                            <div key={i} className="relative w-8 h-8 rounded-full overflow-hidden border border-border-color hover:scale-110 transition-transform cursor-pointer shadow-lg">
                                                                <input
                                                                    type="color"
                                                                    value={color}
                                                                    onChange={(e) => {
                                                                        const newColors = [...config.branding.colors];
                                                                        newColors[i] = e.target.value;
                                                                        setConfig({ ...config, branding: { ...config.branding, colors: newColors } });
                                                                    }}
                                                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-none opacity-0"
                                                                />
                                                                <div className="w-full h-full" style={{ backgroundColor: color }}></div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-6 border-t border-border-color pt-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                                                                <FaQrcode /> QR Code
                                                            </label>
                                                            <button
                                                                onClick={() => setConfig({ ...config, posterElements: { ...config.posterElements, qrEnabled: !config.posterElements?.qrEnabled } })}
                                                                className={`w-10 h-5 rounded-full relative transition-colors ${config.posterElements?.qrEnabled ? 'bg-primary' : 'bg-bg-primary border border-border-color'}`}
                                                            >
                                                                <span className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${config.posterElements?.qrEnabled ? 'translate-x-5' : 'translate-x-0 bg-text-muted'}`}></span>
                                                            </button>
                                                        </div>

                                                        {config.posterElements?.qrEnabled && (
                                                            <div>
                                                                <label className="text-xs font-bold text-text-muted block mb-2 uppercase flex justify-between">
                                                                    <span>Size</span>
                                                                    <span className="text-text-main">{config.posterElements?.qrSize || 250}px</span>
                                                                </label>
                                                                <input
                                                                    type="range" min="100" max="500"
                                                                    value={config.posterElements?.qrSize || 250}
                                                                    onChange={(e) => setConfig({ ...config, posterElements: { ...config.posterElements, qrSize: parseInt(e.target.value) } })}
                                                                    className="w-full accent-primary cursor-pointer bg-transparent py-2"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </div>
                        </div>

                        {/* CENTER: Canvas Workspace */}
                        <div className="flex-1 bg-bg-tertiary relative overflow-hidden flex flex-col">

                            {/* Floating Toolbar */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-bg-secondary/90 backdrop-blur-md px-4 py-2 rounded-full border border-border-color shadow-2xl transition-all hover:bg-bg-secondary">
                                <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-text-muted hover:text-text-main disabled:opacity-30 tooltip" title="Undo"><FaUndo /></button>
                                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-text-muted hover:text-text-main disabled:opacity-30 tooltip" title="Redo"><FaRedo /></button>
                                <div className="w-px h-4 bg-border-color mx-2"></div>
                                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.05))} className="p-2 text-text-muted hover:text-text-main"><FaSearchMinus /></button>
                                <span className="text-xs font-mono text-text-muted w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(z => Math.min(2, z + 0.05))} className="p-2 text-text-muted hover:text-text-main"><FaSearchPlus /></button>
                                <button onClick={() => {
                                    // Smart Fit: Calculate exact zoom to fit container with padding
                                    const container = document.getElementById('canvas-container');
                                    if (container) {
                                        const padding = 80;
                                        const w = container.clientWidth - padding;
                                        const h = container.clientHeight - padding;
                                        const optimal = Math.min(w / 1080, h / 1600);
                                        setZoom(Math.max(0.2, Math.min(1.5, optimal)));
                                    }
                                }} className="p-2 text-text-muted hover:text-text-main" title="Fit to Screen"><FaCompress /></button>
                                <div className="w-px h-4 bg-border-color mx-2"></div>
                                <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text-main'}`} title="Toggle Grid"><FaMagnet /></button>
                            </div>

                            {/* Scrollable Area */}
                            <div id="canvas-container" className="flex-1 overflow-auto flex items-center justify-center custom-scrollbar bg-[url('/grid-pattern.svg')] p-10">

                                {/* Dynamic Wrapper: Matches VISUAL size of canvas so flex-center works correctly */}
                                <div style={{ width: 1080 * zoom, height: 1600 * zoom, transition: 'width 0.2s, height 0.2s' }} className="relative flex-shrink-0">
                                    <div
                                        ref={imageRef}
                                        className="absolute top-0 left-0 bg-white shadow-2xl border border-border-color origin-top-left transition-transform duration-200 ease-out"
                                        style={{
                                            width: '1080px',
                                            height: '1600px',
                                            transform: `scale(${zoom})`,
                                            backgroundImage: showGrid ? 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)' : 'none',
                                            backgroundSize: '100px 100px'
                                        }}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onClick={handleCanvasClick}
                                    >
                                        {/* Grid Overlay Guide */}
                                        {showGrid && (
                                            <div className="absolute inset-0 pointer-events-none z-50 opacity-20">
                                                <div className="absolute top-1/2 left-0 w-full h-px bg-red-500"></div>
                                                <div className="absolute left-1/2 top-0 h-full w-px bg-red-500"></div>
                                            </div>
                                        )}

                                        {bgPreview ? (
                                            <>
                                                <img src={bgPreview} alt="Background" className="w-full h-full object-cover pointer-events-none select-none" />

                                                {/* Draggable Photo Area */}
                                                {config.coordinates.photo && (
                                                    <div
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, 'photo')}
                                                        style={{
                                                            top: config.coordinates.photo.y + 'px',
                                                            left: config.coordinates.photo.x + 'px',
                                                            width: (config.coordinates.photo.radius * 2) + 'px',
                                                            height: (config.coordinates.photo.radius * 2) + 'px',
                                                            borderRadius: config.coordinates.photo.shape === 'square' ? '20px' : '50%'
                                                        }}
                                                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move flex items-center justify-center transition-all group/item
                                                            ${selectedField === 'photo' ? 'ring-4 ring-primary bg-primary/10 z-50' : 'hover:ring-2 hover:ring-white/50 bg-black/20 z-10'}`}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedField('photo'); }}
                                                    >
                                                        <span className="text-xs text-white font-bold tracking-widest opacity-70 drop-shadow-md">PHOTO</span>
                                                        {selectedField === 'photo' && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">Drag to Move</div>}
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
                                                                top: pos.y + 'px',
                                                                left: pos.x + 'px',
                                                                transform: `translate(${style.align === 'left' ? '0' : style.align === 'right' ? '-100%' : '-50%'}, -50%)`,
                                                                fontSize: style.size + 'px',
                                                                color: style.color,
                                                                fontFamily: style.fontFamily,
                                                                fontWeight: style.weight,
                                                                textAlign: style.align,
                                                                cursor: 'move',
                                                                lineHeight: 1.2
                                                            }}
                                                            className={`absolute whitespace-nowrap select-none transition-all group/text 
                                                                ${selectedField === key ? 'ring-2 ring-primary bg-primary/5 z-50' : 'hover:ring-1 hover:ring-white/30 z-10'}`}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedField(key); }}
                                                        >
                                                            {(() => {
                                                                let displayText = key.toUpperCase();
                                                                if (['name'].includes(key)) displayText = 'JOHN DOE';
                                                                else if (['company'].includes(key)) displayText = 'ACME CORP';
                                                                else if (['email'].includes(key)) displayText = 'user@example.com';
                                                                else if (['website'].includes(key)) displayText = 'WWW.WEBSITE.COM';
                                                                else if (config.posterElements?.[key]) displayText = config.posterElements[key];
                                                                return displayText;
                                                            })()}

                                                            {/* Hover Hints */}
                                                            {selectedField === key && (
                                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-white px-2 rounded whitespace-nowrap pointer-events-none">
                                                                    {key}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* QR Code */}
                                                {config.posterElements?.qrEnabled && (
                                                    <div
                                                        className="absolute border-4 border-dashed border-slate-300 opacity-50 bg-white"
                                                        style={{
                                                            width: (config.posterElements?.qrSize || 250) + 'px',
                                                            height: (config.posterElements?.qrSize || 250) + 'px',
                                                            bottom: '200px',
                                                            right: '50px' // Default position, ideally this should be draggable too
                                                        }}
                                                    >
                                                        <div className="w-full h-full bg-black/10 flex items-center justify-center text-slate-500 text-sm font-bold">QR AREA</div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-neutral-900 gap-6">
                                                <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                                    <FaImage className="text-5xl opacity-20" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-2xl font-bold text-slate-300 mb-2">Start Designing</h3>
                                                    <p className="text-slate-500 max-w-md mx-auto">Upload a background image (1080x1600) to begin.</p>
                                                </div>
                                                <button onClick={() => document.getElementById('bg-upload').click()} className="px-8 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25">
                                                    Upload Background
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
