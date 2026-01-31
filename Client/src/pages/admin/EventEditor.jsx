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

    if (loading && !event) return <div className="p-10">Loading Architect...</div>;

    return (
        <div className="event-editor fade-in" style={{ padding: '2rem', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link to="/admin" style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Back to Dashboard</Link>
                    <h1 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{event.title} <span style={{ fontSize: '1rem', opacity: 0.5 }}>(/{event.slug})</span></h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setActiveTab('config')} className={`btn ${activeTab === 'config' ? 'btn-active' : ''}`}>Configuration Engine</button>
                    <button onClick={() => setActiveTab('leads')} className={`btn ${activeTab === 'leads' ? 'btn-active' : ''}`}>Lead Governance</button>
                </div>
            </header>

            {msg && <div className="alert" style={{ background: '#22c55e22', color: '#22c55e', padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem' }}>{msg}</div>}

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', gap: '2rem', overflow: 'hidden' }}>

                {/* CONFIGURATION TAB */}
                {activeTab === 'config' && (
                    <>
                        {/* Left Panel: Settings */}
                        <div style={{ width: '350px', overflowY: 'auto', paddingRight: '1rem' }} className="scrollbar-hide">
                            <div className="panel-section">
                                <h3>Template Assets</h3>
                                <div className="form-group">
                                    <label>Master Background (1080x1920)</label>
                                    <input type="file" onChange={(e) => handleFileChange(e, 'bg')} />
                                </div>
                                <div className="form-group">
                                    <label>Watermark (PNG)</label>
                                    <input type="file" onChange={(e) => handleFileChange(e, 'wm')} />
                                </div>
                            </div>

                            <div className="panel-section">
                                <h3>Typography Locking</h3>
                                <div className="form-group">
                                    <label>Font Family</label>
                                    <select value={config.typography.fontFamily} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, fontFamily: e.target.value } })}>
                                        <option value="Arial">Arial</option>
                                        <option value="Inter">Inter</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Outfit">Outfit</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Name Style</label>
                                    <div className="row">
                                        <input type="number" placeholder="Size" value={config.typography.name.size} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, name: { ...config.typography.name, size: parseInt(e.target.value) } } })} />
                                        <input type="color" value={config.typography.name.color} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, name: { ...config.typography.name, color: e.target.value } } })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Designation Style</label>
                                    <div className="row">
                                        <input type="number" placeholder="Size" value={config.typography.designation.size} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, designation: { ...config.typography.designation, size: parseInt(e.target.value) } } })} />
                                        <input type="color" value={config.typography.designation.color} onChange={(e) => setConfig({ ...config, typography: { ...config.typography, designation: { ...config.typography.designation, color: e.target.value } } })} />
                                    </div>
                                </div>
                            </div>

                            <div className="panel-section">
                                <h3>Validation Rules</h3>
                                <div className="form-group">
                                    <label>Name Char Limit</label>
                                    <input type="number" value={config.validation.nameLimit} onChange={(e) => setConfig({ ...config, validation: { ...config.validation, nameLimit: parseInt(e.target.value) } })} />
                                </div>
                                <div className="form-group">
                                    <label>Company Char Limit</label>
                                    <input type="number" value={config.validation.companyLimit} onChange={(e) => setConfig({ ...config, validation: { ...config.validation, companyLimit: parseInt(e.target.value) } })} />
                                </div>
                            </div>

                            <div className="panel-section">
                                <h3>Status</h3>
                                <select value={event.status} onChange={(e) => setEvent({ ...event, status: e.target.value })}>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="panel-section">
                                <h3>Sponsors</h3>
                                <div className="form-group">
                                    <label>Sponsor Logos (URLs)</label>
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
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white' }}
                                    />
                                </div>
                            </div>

                            <div className="panel-section">
                                <h3>Roles & Categories</h3>
                                <div className="form-group">
                                    <label>Add Role (e.g. Visitor)</label>
                                    <div className="row">
                                        <input
                                            id="new-role-input"
                                            type="text"
                                            placeholder="Label"
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
                                        <button className="btn" onClick={() => {
                                            const el = document.getElementById('new-role-input');
                                            const val = el.value.trim();
                                            if (val) {
                                                setConfig({ ...config, roles: [...(config.roles || []), { label: val }] });
                                                el.value = '';
                                            }
                                        }}>+</button>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {config.roles?.map((r, i) => (
                                            <div key={i} style={{ background: '#334155', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {r.label}
                                                <span
                                                    style={{ cursor: 'pointer', color: '#ff5555' }}
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

                            <button onClick={handleSave} className="save-btn">Save & Deploy</button>
                        </div>

                        {/* Right Panel: Visual Editor */}
                        <div style={{ flex: 1, background: '#1e293b', borderRadius: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                            {bgPreview ? (
                                <div
                                    className="preview-container"
                                    style={{ position: 'relative', height: '90%', aspectRatio: '9/16', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <img
                                        ref={imageRef}
                                        src={bgPreview}
                                        alt="Master Template"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                                    />
                                    {wmPreview && (
                                        <img src={wmPreview} alt="Watermark" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none' }} />
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
                                                    position: 'absolute',
                                                    left, top,
                                                    transform: 'translate(-50%, -50%)',
                                                    cursor: 'move',
                                                    background: key === 'photo' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 100, 255, 0.7)',
                                                    border: '2px solid white',
                                                    borderRadius: key === 'photo' ? '50%' : '4px',
                                                    width: key === 'photo' ? (config.coordinates.photo.radius * 2 / 1080 * 100) + '%' : 'auto',
                                                    height: key === 'photo' ? (config.coordinates.photo.radius * 2 / 1080 * 100 * (9 / 16)) + '%' : 'auto',
                                                    padding: key === 'photo' ? 0 : '4px 8px',
                                                    color: 'white',
                                                    fontSize: '0.8rem',
                                                    aspectRatio: key === 'photo' ? '1/1' : 'auto'
                                                }}
                                                title={`Drag to position ${key}`}
                                            >
                                                {key === 'photo' ? '' : key.toUpperCase()}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-gray-500">Upload a Background Image to Start Configuration</div>
                            )}
                            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.7)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                Drag markers to set Coordinate Mapping.
                            </div>
                        </div>
                    </>
                )}

                {/* LEADS TAB */}
                {activeTab === 'leads' && (
                    <div style={{ width: '100%', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Participant Data</h3>
                            <button className="btn" onClick={() => window.open(`/api/events/${id}/leads`, '_blank')}>Export CSV</button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                    <th className="p-2 text-left">Name</th>
                                    <th className="p-2 text-left">Designation</th>
                                    <th className="p-2 text-left">Company</th>
                                    <th className="p-2 text-left">Mobile</th>
                                    <th className="p-2 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {event.leads?.map((lead, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                        <td className="p-2">{lead.name}</td>
                                        <td className="p-2">{lead.designation}</td>
                                        <td className="p-2">{lead.company}</td>
                                        <td className="p-2">{lead.mobile}</td>
                                        <td className="p-2">{new Date(lead.createdAt).toLocaleDateString()}</td>
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
