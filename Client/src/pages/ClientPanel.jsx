import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as fabric from 'fabric';

const ClientPanel = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [placeholders, setPlaceholders] = useState([]);
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await axios.get('/api/templates');
                setTemplates(res.data);
            } catch (err) {
                console.error("Error fetching templates", err);
            }
        };
        fetchTemplates();
    }, []);

    // Initialize Canvas and Load Template
    useEffect(() => {
        if (selectedTemplate && canvasRef.current) {
            if (fabricCanvas) {
                fabricCanvas.dispose();
            }

            const fabricInstance = fabric.fabric || fabric;
            const newCanvas = new fabricInstance.Canvas(canvasRef.current, {
                width: 400, // Initial width, will resize based on template
                height: 600,
                backgroundColor: '#f3f4f6',
                selection: false, // User shouldn't select/move things in preview mode typically
                hoverCursor: 'default'
            });

            setLoading(true);

            // Load from JSON
            // The background image URL might need to be refreshed or cors handled, but Cloudinary is usually fine.
            newCanvas.loadFromJSON(selectedTemplate.elements, () => {
                newCanvas.renderAll();
                setFabricCanvas(newCanvas);

                // Extract placeholders
                const objs = newCanvas.getObjects();
                const foundPlaceholders = [];

                // Find text objects that act as variables
                // We look for {{...}} pattern or just map from the known structure if we saved metadata
                // For this simple version, we assume any IText with {{}} is a variable.
                objs.forEach(obj => {
                    if (obj.type === 'i-text' || obj.type === 'text') {
                        const match = obj.text.match(/{{(.*?)}}/);
                        if (match) {
                            foundPlaceholders.push({
                                key: match[1], // e.g. "event_name"
                                originalText: obj.text,
                                id: obj.id || `var_${match[1]}` // fallback
                            });

                            // Set ID if not present for easier lookup later
                            if (!obj.id) obj.set('id', `var_${match[1]}`);
                        }
                    }
                    // Lock everything
                    obj.set({
                        selectable: false,
                        evented: false,
                        lockMovementX: true,
                        lockMovementY: true
                    });
                });

                setPlaceholders(foundPlaceholders);
                setFormData({}); // Reset form
                setLoading(false);
            }, (o, object) => {
                // Reviver function if needed
            });

            // Resize canvas to match template aspect ratio
            // selectedTemplate might store dimensions
            // For now rely on loadFromJSON
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate]);

    // Handle Input Change -> Live Update
    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));

        if (fabricCanvas) {
            const objs = fabricCanvas.getObjects();

            objs.forEach(obj => {
                if (obj.type === 'i-text' || obj.type === 'text') {
                    // Check if this object corresponds to the key
                    // We look for the custom id we might have set or the original text pattern
                    // A simple way: store the "template pattern" on the object itself when loading?
                    // Or just Regex match the *current* text? No, because we overwrite it.
                    // We need to know which object was {{event_name}}.

                    // Let's use the ID we set during load.
                    if (obj.id === `var_${key}`) {
                        // If value is empty, revert to placeholder? Or show empty?
                        // Show value or placeholder if empty
                        obj.set('text', value || `{{${key}}}`);
                        fabricCanvas.requestRenderAll();
                    }
                }
            });
        }
    };

    const handleDownload = () => {
        if (!fabricCanvas) return;
        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2 // High res
        });

        const link = document.createElement('a');
        link.download = `poster-${selectedTemplate.name}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="client-panel fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem' }}>The Editor</h1>
                <p style={{ color: 'var(--text-muted)' }}>Customize your poster in real-time.</p>
            </header>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                {/* Template List & Form */}
                <div style={{ flex: 1, minWidth: '300px' }}>

                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>1. Choose Template</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                            {templates.map(t => (
                                <div
                                    key={t._id}
                                    onClick={() => setSelectedTemplate(t)}
                                    style={{
                                        cursor: 'pointer',
                                        border: selectedTemplate?._id === t._id ? '2px solid var(--primary-color)' : '2px solid transparent',
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img src={t.backgroundImageUrl} alt={t.name} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                    <div style={{ padding: '0.5rem', background: '#334155', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                                </div>
                            ))}
                            {templates.length === 0 && <p>No templates found. Create one in Admin.</p>}
                        </div>
                    </div>

                    {selectedTemplate && (
                        <div className="card fade-in">
                            <h3 style={{ marginBottom: '1rem' }}>2. Customize Details</h3>
                            {placeholders.length === 0 && <p>No editable text fields found in this template.</p>}
                            {placeholders.map(p => (
                                <div key={p.key} style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                        {p.key.replace(/_/g, ' ')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`Enter ${p.key}`}
                                        value={formData[p.key] || ''}
                                        onChange={(e) => handleInputChange(p.key, e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            ))}
                            <div style={{ marginTop: '2rem' }}>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={handleDownload}>
                                    Download Poster
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Area */}
                <div className="card" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#334155', minHeight: '600px' }}>
                    {selectedTemplate ? (
                        <div style={{ position: 'relative' }}>
                            <canvas ref={canvasRef} />
                            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>Loading Template...</div>}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>Select a template to preview</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ClientPanel;
