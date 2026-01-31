import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const EventEditor = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('config');
    const [msg, setMsg] = useState('');

    // Config State
    const [config, setConfig] = useState({
        coordinates: { photo: { x: 0, y: 0, radius: 100 }, name: { x: 0, y: 0 }, designation: { x: 0, y: 0 }, company: { x: 0, y: 0 } },
        typography: { fontFamily: 'Arial', name: { size: 40, color: '#000000' }, designation: { size: 24, color: '#555555' }, company: { size: 24, color: '#555555' } },
        validation: { nameLimit: 20, companyLimit: 30 },
        backgroundImageUrl: '',
        watermarkUrl: '',
        sponsors: [], // Array of { imageUrl, visible }
        roles: [] // Array of { label, backgroundImageUrl }
    });

    // File Inputs
    const [bgFile, setBgFile] = useState(null);
    const [wmFile, setWmFile] = useState(null);
    const [bgPreview, setBgPreview] = useState('');
    const [wmPreview, setWmPreview] = useState('');

    const imageRef = useRef(null);
    const [dragging, setDragging] = useState(null); // 'photo', 'name', 'designation'

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await axios.get(`/api/events/${id}?byId=true`);
            setEvent(res.data);
            if (res.data.config) {
                setConfig({ ...res.data.config });
                setBgPreview(res.data.config.backgroundImageUrl);
                setWmPreview(res.data.config.watermarkUrl);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setMsg('Error fetching event');
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'bg') {
                setBgFile(file);
                setBgPreview(URL.createObjectURL(file));
            } else {
                setWmFile(file);
                setWmPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const formData = new FormData();
        if (bgFile) formData.append('background', bgFile);
        if (wmFile) formData.append('watermark', wmFile);

        formData.append('coordinates', JSON.stringify(config.coordinates));
        formData.append('typography', JSON.stringify(config.typography));
        formData.append('validation', JSON.stringify(config.validation));
        formData.append('status', event.status);
        formData.append('sponsors', JSON.stringify(config.sponsors));
        formData.append('roles', JSON.stringify(config.roles));

        try {
            const res = await axios.put(`/api/events/${id}/config`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEvent(res.data);
            setMsg('Configuration Saved & Deployed!');
        } catch (err) {
            setMsg('Error saving: ' + err.message);
        } finally {
            setLoading(false);
        }
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

    if (loading && !event) return <div className="p-10 text-white">Loading Architect...</div>;

    return (
        <div className="h-screen bg-bg-primary text-slate-200 flex flex-col overflow-hidden animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <header className="px-8 py-4 bg-bg-tertiary border-b border-white/10 flex justify-between items-center shrink-0">
                <div>
                    <Link to="/admin" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                        &larr; Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold mt-1 text-white">{event.title} <span className="text-sm font-normal text-slate-500 font-mono ml-2">/{event.slug}</span></h1>
                </div>
                <div className="flex gap-4 p-1 bg-black/20 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-primary text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Configuration Engine
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'leads' ? 'bg-primary text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Lead Governance
                    </button>
                </div>
            </header>

            {msg && (
                <div className="mx-8 mt-4 px-4 py-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {msg}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 gap-8 p-8 overflow-hidden">

                {/* CONFIGURATION TAB */}
                {activeTab === 'config' && (
                    <>
                        {/* Left Panel: Settings */}
                        <div className="w-[380px] overflow-y-auto pr-4 space-y-6">

                            <div className="bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Template Assets</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Master Background (1080x1920)</label>
                                        <input type="file" onChange={(e) => handleFileChange(e, 'bg')} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary-light hover:file:bg-primary/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Watermark (PNG)</label>
                                        <input type="file" onChange={(e) => handleFileChange(e, 'wm')} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary-light hover:file:bg-primary/30" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Typography Locking</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Font Family</label>
                                        <select
                                            value={config.typography.fontFamily}
                                            onChange={(e) => setConfig({ ...config, typography: { ...config.typography, fontFamily: e.target.value } })}
                                            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                        >
                                            <option value="Arial">Arial</option>
                                            <option value="Inter">Inter</option>
                                            <option value="Roboto">Roboto</option>
                                            <option value="Outfit">Outfit</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Name Style</label>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="Size" value={config.typography.name.size} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, name: { ...config.typography.name, size: parseInt(e.target.value) } } })} className="w-20 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white" />
                                            <input type="color" value={config.typography.name.color} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, name: { ...config.typography.name, color: e.target.value } } })} className="h-10 w-full cursor-pointer bg-transparent rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Designation Style</label>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="Size" value={config.typography.designation.size} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, designation: { ...config.typography.designation, size: parseInt(e.target.value) } } })} className="w-20 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white" />
                                            <input type="color" value={config.typography.designation.color} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, designation: { ...config.typography.designation, color: e.target.value } } })} className="h-10 w-full cursor-pointer bg-transparent rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Validation Rules</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Name Char Limit</label>
                                        <input type="number" value={config.validation.nameLimit} onChange={(e) => setConfig({ ...config, validation: { ...config.validation, nameLimit: parseInt(e.target.value) } })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Company Char Limit</label>
                                        <input type="number" value={config.validation.companyLimit} onChange={(e) => setConfig({ ...config, validation: { ...config.validation, companyLimit: parseInt(e.target.value) } })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Status</h3>
                                <select value={event.status} onChange={(e) => setEvent({ ...event, status: e.target.value })} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white">
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sponsors</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Sponsor Logos (URLs)</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Paste image URLs separated by comma"
                                        value={config.sponsors?.map(s => s.imageUrl).join(', ') || ''}
                                        onChange={(e) => {
                                            const urls = e.target.value.split(',').map(u => u.trim()).filter(Boolean);
                                            setConfig({
                                                ...config,
                                                sponsors: urls.map(u => ({ imageUrl: u, visible: true }))
                                            });
                                        }}
                                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div className="bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Roles & Categories</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Add Role (e.g. Visitor)</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="new-role-input"
                                            type="text"
                                            placeholder="Label"
                                            className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.target.value.trim();
                                                    if (val) {
                                                        setConfig({ ...config, roles: [...(config.roles || []), { label: val }] });
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button className="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors" onClick={() => {
                                            const el = document.getElementById('new-role-input');
                                            const val = el.value.trim();
                                            if (val) {
                                                setConfig({ ...config, roles: [...(config.roles || []), { label: val }] });
                                                el.value = '';
                                            }
                                        }}>+</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {config.roles?.map((r, i) => (
                                            <div key={i} className="bg-slate-700 px-2 py-1 rounded text-xs flex items-center gap-2">
                                                {r.label}
                                                <span
                                                    className="cursor-pointer text-red-400 hover:text-red-300"
                                                    onClick={() => {
                                                        const newRoles = [...config.roles];
                                                        newRoles.splice(i, 1);
                                                        setConfig({ ...config, roles: newRoles });
                                                    }}
                                                >&times;</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSave} className="w-full py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all">Save & Deploy</button>
                        </div>

                        {/* Right Panel: Visual Editor */}
                        <div className="flex-1 bg-bg-secondary border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-inner bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">
                            {bgPreview ? (
                                <div
                                    className="relative h-[90%] aspect-[9/16] shadow-2xl"
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <img
                                        ref={imageRef}
                                        src={bgPreview}
                                        alt="Master Template"
                                        className="w-full h-full object-contain pointer-events-none"
                                    />
                                    {wmPreview && (
                                        <img src={wmPreview} alt="Watermark" className="absolute top-0 left-0 w-full h-full opacity-50 pointer-events-none" />
                                    )}
                                    {['photo', 'name', 'designation', 'company'].map(key => {
                                        const pos = config.coordinates[key];
                                        const left = (pos.x / 1080) * 100 + '%';
                                        const top = (pos.y / 1920) * 100 + '%';

                                        return (
                                            <div
                                                key={key}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, key)}
                                                style={{
                                                    top: top,
                                                    left: left,
                                                    width: key === 'photo' ? (config.coordinates.photo.radius * 2 / 1080 * 100) + '%' : 'auto',
                                                    height: key === 'photo' ? (config.coordinates.photo.radius * 2 / 1080 * 100 * (9 / 16)) + '%' : 'auto',
                                                }}
                                                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move border-2 border-white text-white text-xs font-bold flex items-center justify-center shadow-lg ${key === 'photo' ? 'bg-red-500/40 rounded-full aspect-square' : 'bg-blue-500/70 rounded px-2 py-1'}`}
                                                title={`Drag to position ${key}`}
                                            >
                                                {key === 'photo' ? '' : key.toUpperCase()}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-slate-500 flex flex-col items-center">
                                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p>Upload a Background Image to Start Configuration</p>
                                </div>
                            )}
                            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur px-4 py-2 rounded-lg text-xs text-slate-300 border border-white/5">
                                Drag markers to set Coordinate Mapping.
                            </div>
                        </div>
                    </>
                )}

                {/* LEADS TAB */}
                {activeTab === 'leads' && (
                    <div className="w-full overflow-y-auto bg-bg-tertiary border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Participant Data</h3>
                            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors" onClick={() => window.open(`/api/events/${id}/leads`, '_blank')}>Export CSV</button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-slate-400">
                                <tr>
                                    <th className="p-3 rounded-tl-lg">Name</th>
                                    <th className="p-3">Designation</th>
                                    <th className="p-3">Company</th>
                                    <th className="p-3">Mobile</th>
                                    <th className="p-3 rounded-tr-lg">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {event.leads?.map((lead, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 text-white">{lead.name}</td>
                                        <td className="p-3 text-slate-300">{lead.designation}</td>
                                        <td className="p-3 text-slate-300">{lead.company}</td>
                                        <td className="p-3 text-slate-300">{lead.mobile}</td>
                                        <td className="p-3 text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventEditor;
