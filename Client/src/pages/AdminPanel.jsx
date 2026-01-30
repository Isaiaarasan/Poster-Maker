import React, { useState } from 'react';
import CanvasEditor from '../components/CanvasEditor';
import axios from 'axios';

const AdminPanel = () => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSaveTemplate = async (data) => {
        if (!data.name || !data.bgFile) {
            setMsg('Error: Name and Background Image are required.');
            return;
        }

        setLoading(true);
        setMsg('');

        try {
            const formData = new FormData();
            formData.append('name', data.name);
            // We will parse this carefully on backend. Send the raw fabric object for full restore capability.
            // But also send a simplified elements array if needed for querying. 
            // For now, let's just stick the whole JSON in elements.
            formData.append('elements', data.fabricJson);
            formData.append('canvasWidth', data.width);
            formData.append('canvasHeight', data.height);

            formData.append('backgroundImage', data.bgFile);

            // Note: In Vite setup, /api is proxied to http://localhost:5000/api
            const res = await axios.post('/api/templates', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMsg('Template Saved Successfully! ID: ' + res.data._id);
        } catch (error) {
            console.error(error);
            setMsg('Error saving template: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-panel fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>The Architect</h1>
                <p style={{ color: 'var(--text-muted)' }}>Design high-quality templates for your clients. Drag, drop, and map variables.</p>
            </header>

            {msg && (
                <div style={{
                    padding: '1rem',
                    background: msg.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    border: `1px solid ${msg.includes('Error') ? '#ef4444' : '#22c55e'}`,
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    color: 'white'
                }}>
                    {msg}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Uploading Assets to Cloud...</div>
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <CanvasEditor onSave={handleSaveTemplate} />
            )}
        </div>
    );
};

export default AdminPanel;
