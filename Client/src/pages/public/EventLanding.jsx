import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUpload, FaDownload, FaLinkedin, FaTwitter, FaWhatsapp, FaCamera, FaSpinner, FaCheckCircle, FaMagic
} from 'react-icons/fa';
import * as fabric from 'fabric';

const PublicEventPage = () => {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);

    // Form Data - dynamic
    const [formData, setFormData] = useState({
        role: ''
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/api/events/${slug}`);
                setEvent(res.data);
                if (res.data.config?.roles?.length > 0) {
                    setFormData(prev => ({ ...prev, role: res.data.config.roles[0].label }));
                }

                // Load All Unique Fonts
                const fontsForUrl = new Set();
                const globalFont = res.data.config?.typography?.fontFamily || 'Arial';
                fontsForUrl.add(`${globalFont.replace(' ', '+')}:wght@400;700;800`);

                Object.values(res.data.config?.typography || {}).forEach(style => {
                    if (style.fontFamily) {
                        fontsForUrl.add(`${style.fontFamily.replace(' ', '+')}:wght@400;700;800`);
                    }
                });

                fontsForUrl.forEach(fontString => {
                    const link = document.createElement('link');
                    link.href = `https://fonts.googleapis.com/css2?family=${fontString}&display=swap`;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [slug]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            setPhotoPreview(URL.createObjectURL(file));
            // Auto advance or just show preview
            if (step === 1) setStep(1);
        }
    };

    // Initialize Fabric Canvas
    useEffect(() => {
        if (!canvasRef.current || !event) return;

        const fabricInstance = fabric.fabric || fabric;
        const newCanvas = new fabricInstance.StaticCanvas(canvasRef.current, {
            width: 1080,
            height: 1600,
            backgroundColor: '#fff'
        });

        setFabricCanvas(newCanvas);

        return () => {
            newCanvas.dispose();
        };
    }, [event]);  // Re-init if event loads (only happens once effectively)

    // Render Canvas Content
    useEffect(() => {
        if (!fabricCanvas || !event) return;

        const updateCanvas = async () => {
            fabricCanvas.clear();
            const fabricInstance = fabric.fabric || fabric;

            const { config } = event;

            // IMMEDIATE BASE LAYER: White Background
            const baseRect = new fabricInstance.Rect({
                width: 1080, height: 1600,
                fill: '#ffffff',
                selectable: false,
                left: 0, top: 0
            });
            fabricCanvas.add(baseRect);

            // Determine Background URL
            let bgUrl = config.backgroundImageUrl;
            if (formData.role) {
                const roleConfig = config.roles?.find(r => r.label === formData.role);
                if (roleConfig && roleConfig.backgroundImageUrl) {
                    bgUrl = roleConfig.backgroundImageUrl;
                }
            }

            // LAYER 1: Background Image
            if (bgUrl) {
                try {
                    const cleanUrl = bgUrl + (bgUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                    const img = await new Promise((resolve) => {
                        const i = new Image(); i.crossOrigin = 'anonymous'; i.src = cleanUrl;
                        i.onload = () => resolve(new fabricInstance.Image(i));
                        i.onerror = () => resolve(null);
                    });
                    if (img) {
                        // SCALING LOGIC: Cover & Center (1600 height)
                        const scale = Math.max(1080 / img.width, 1600 / img.height);
                        img.scale(scale);

                        img.set({
                            originX: 'center',
                            originY: 'center',
                            left: 540,
                            top: 800,
                            selectable: false
                        });

                        fabricCanvas.add(img);
                        fabricCanvas.sendToBack(img);
                    }
                } catch (e) { console.error("BG Error", e); }
            }

            // LAYER 2: Photo
            if (config.coordinates.photo && photoPreview) {
                try {
                    const { x, y, radius, shape } = config.coordinates.photo;
                    const photoImg = await new Promise((resolve) => {
                        const i = new Image(); i.src = photoPreview;
                        i.onload = () => resolve(new fabricInstance.Image(i));
                        i.onerror = () => resolve(null);
                    });

                    if (photoImg) {
                        let clipPath;
                        const size = radius * 2;

                        // Use absolute positioning for clipPath to avoid scaling inheritance from the image
                        if (shape === 'square') {
                            clipPath = new fabricInstance.Rect({
                                width: size, height: size,
                                rx: 20, ry: 20,
                                originX: 'center', originY: 'center',
                                absolutePositioned: true,
                                left: x, top: y
                            });
                        } else {
                            clipPath = new fabricInstance.Circle({
                                radius: radius,
                                originX: 'center', originY: 'center',
                                absolutePositioned: true,
                                left: x, top: y
                            });
                        }

                        // Smart Scaling to Fill the Area
                        // We want the image to COVER the circle/square.
                        const scale = Math.max(size / photoImg.width, size / photoImg.height);
                        photoImg.scale(scale);

                        photoImg.set({
                            left: x,
                            top: y,
                            originX: 'center',
                            originY: 'center',
                            clipPath: clipPath,
                            selectable: false
                        });
                        fabricCanvas.add(photoImg);
                    }
                } catch (e) { console.error("Photo Error", e); }
            }

            // LAYER 3: Text Fields
            const fields = Object.keys(config.coordinates).filter(k => k !== 'photo');
            fields.forEach(key => {
                let text = formData[key] || '';
                // Fallback to static config or placeholder
                if (!text && config.posterElements && config.posterElements[key]) {
                    text = config.posterElements[key];
                }

                // If it's empty, and we are in preview mode, maybe show placeholder? 
                // No, user wants to see what they type.

                if (!text) return;

                const style = config.typography[key] || { size: 24, color: '#000000' };
                const textObj = new fabricInstance.Text(text, {
                    left: config.coordinates[key].x,
                    top: config.coordinates[key].y,
                    fontSize: style.size,
                    fill: style.color,
                    fontFamily: style.fontFamily || 'Arial',
                    fontWeight: style.weight === 'bold' ? 'bold' : 'normal',
                    textAlign: style.align || 'center',
                    originX: style.align === 'left' ? 'left' : (style.align === 'right' ? 'right' : 'center'),
                    originY: 'middle',
                    selectable: false
                });
                fabricCanvas.add(textObj);
            });

            // LAYER 4: QR Code
            if (config.posterElements?.qrEnabled) {
                try {
                    const qrSize = config.posterElements.qrSize || 250;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;
                    const qrImg = await new Promise((resolve) => {
                        const i = new Image(); i.crossOrigin = 'anonymous'; i.src = qrUrl;
                        i.onload = () => resolve(new fabricInstance.Image(i));
                        i.onerror = () => resolve(null);
                    });
                    if (qrImg) {
                        qrImg.set({
                            left: 1080 - qrSize - 50,
                            top: 1600 - qrSize - 50,
                            scaleX: qrSize / qrImg.width,
                            scaleY: qrSize / qrImg.height,
                            selectable: false
                        });
                        fabricCanvas.add(qrImg);
                    }
                } catch (e) { }
            }

            // 5. Watermark
            if (config.watermarkUrl) {
                const wmImg = await new Promise((resolve) => {
                    const imgEl = new Image();
                    imgEl.crossOrigin = 'anonymous';
                    imgEl.src = config.watermarkUrl;
                    imgEl.onload = () => resolve(new fabricInstance.Image(imgEl));
                    imgEl.onerror = () => resolve(null);
                });
                if (wmImg) {
                    wmImg.scaleToWidth(1080);
                    fabricCanvas.add(wmImg);
                }
            }

            fabricCanvas.renderAll();
        };

        // Debounce update
        const timer = setTimeout(updateCanvas, 100);
        return () => clearTimeout(timer);

    }, [formData, photoPreview, fabricCanvas, event]);

    const handleHighResWrapper = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.company) {
            alert("Please enter your name and company.");
            return;
        }
        if (!photoPreview) {
            alert("Please upload a photo.");
            return;
        }
        setStep(2);
    };

    const submitLeadAndGenerate = async () => {
        // Validation
        const missingFields = [];
        const requiredFields = fields.filter(key => event.config.formFields?.[key]?.required);

        requiredFields.forEach(key => {
            if (!formData[key]) missingFields.push(event.config.formFields?.[key]?.label || key);
        });

        if (event.config.coordinates.photo && !photoPreview) missingFields.push("Profile Photo");

        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        setIsGenerating(true);
        setStep(3);

        try {
            // 1. Generate High Res Image using Fabric
            // Multiply by 1 or higher if needed. 1080x1920 is already pretty high res for digital.
            const highResDataUrl = fabricCanvas.toDataURL({
                format: 'png',
                multiplier: 1,
                quality: 1
            });

            const res = await fetch(highResDataUrl);
            const blob = await res.blob();

            const posterData = new FormData();
            posterData.append('photo', blob, 'poster.png');

            const uploadRes = await axios.post('/api/events/poster/upload', posterData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const finalPosterUrl = uploadRes.data.url;
            setGeneratedImage(finalPosterUrl);

            await axios.post(`/api/events/${slug}/lead`, {
                ...formData,
                generatedImageUrl: finalPosterUrl,
                photoUrl: null
            });

            setStep(4);
        } catch (error) {
            console.error("High Res Generation Failed", error);
            if (error.response && error.response.status === 403) {
                alert("Event is NOT PUBLISHED. Please go to the Admin Panel and change the status to 'Published' to enable lead collection.");
            } else {
                alert("Failed to generate high-res poster. Please try again.");
            }
            setStep(1);
            setIsGenerating(false);
        }
    }

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.download = `Poster-${formData.name || 'badge'}.png`;
            link.href = generatedImage;
            link.click();
        }
    };

    if (loading) return (
        <div className="h-screen bg-bg-primary flex items-center justify-center">
            <FaSpinner className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    if (!event) return <div className="h-screen bg-black text-white flex items-center justify-center">Event not found</div>;

    const fields = Object.keys(event.config.coordinates).filter(k => k !== 'photo');
    const primaryColor = event.config.branding?.colors?.[2] || '#8b5cf6';
    const secondaryColor = event.config.branding?.colors?.[1] || '#6d28d9';

    return (
        <div className="h-screen bg-bg-primary text-text-main font-sans flex flex-col md:flex-row overflow-hidden relative" style={{ backgroundColor: event.config.branding?.colors?.[0] || 'var(--bg-primary)', color: 'var(--text-main)' }}>

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[150px] rounded-full"></div>
            </div>

            {/* LEFT PANEL: INPUT - Theme Responsive */}
            <div className="w-full md:w-5/12 relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar backdrop-blur-xl bg-bg-secondary/95 border-r border-border-color shadow-2xl transition-colors duration-300">
                <div className="p-6 md:p-12">
                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-main to-text-muted mb-2">
                            {event.title}
                        </h1>
                        <p className="text-sm text-text-muted">Create your official event badge in seconds.</p>
                    </div>

                    <AnimatePresence mode='wait'>
                        {step === 1 && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Role Selection */}
                                {event.config.roles?.length > 0 && (
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-text-muted mb-3 font-bold">Select Role</label>
                                        <div className="flex gap-3 flex-wrap">
                                            {event.config.roles.map(r => (
                                                <button
                                                    key={r.label}
                                                    onClick={() => setFormData({ ...formData, role: r.label })}
                                                    style={{
                                                        backgroundColor: formData.role === r.label ? (primaryColor || '#8b5cf6') : 'var(--bg-tertiary)',
                                                        borderColor: formData.role === r.label ? (primaryColor || '#8b5cf6') : 'var(--border-color)',
                                                        color: formData.role === r.label ? '#fff' : 'var(--text-muted)'
                                                    }}
                                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm hover:border-primary/50`}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Dynamic Inputs */}
                                <div className="space-y-4">
                                    {fields.map(key => {
                                        const fieldConfig = event.config.formFields?.[key] || {};
                                        const label = fieldConfig.label || key.replace(/_/g, ' ');
                                        const placeholder = fieldConfig.placeholder || `Enter your ${label}`;
                                        const isRequired = fieldConfig.required;

                                        // Infer type
                                        let type = "text";
                                        if (key.includes('email')) type = "email";
                                        if (key.includes('mobile') || key.includes('phone')) type = "tel";

                                        return (
                                            <div key={key}>
                                                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">
                                                    {label} {isRequired && <span className="text-red-500">*</span>}
                                                </label>
                                                <input
                                                    name={key}
                                                    type={type}
                                                    required={isRequired}
                                                    value={formData[key] || ''}
                                                    onChange={handleInputChange}
                                                    placeholder={placeholder}
                                                    className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:bg-bg-primary focus:border-primary/50 transition-all font-medium placeholder:text-text-muted/50"
                                                    onFocus={(e) => e.target.style.borderColor = primaryColor || 'var(--primary)'}
                                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Photo Upload */}
                                {event.config.coordinates.photo && (
                                    <div>
                                        <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Profile Photo <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex-1 cursor-pointer group relative overflow-hidden rounded-xl">
                                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                                <div
                                                    className="h-28 border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center gap-2 transition-all bg-bg-tertiary hover:bg-bg-primary hover:border-primary/50 group-hover:text-primary"
                                                >
                                                    <FaCamera className="text-2xl text-text-muted group-hover:text-primary transition-colors" />
                                                    <div className="text-xs text-text-muted group-hover:text-text-main font-medium">
                                                        {photoPreview ? "Change Photo" : "Upload Selfie"}
                                                    </div>
                                                </div>
                                            </label>
                                            {photoPreview && (
                                                <div className="w-28 h-28 rounded-xl overflow-hidden border-2 shadow-xl" style={{ borderColor: primaryColor || '#8b5cf6' }}>
                                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={submitLeadAndGenerate}
                                    style={{ background: `linear-gradient(to right, ${primaryColor || '#8b5cf6'}, ${secondaryColor || '#3b82f6'})` }}
                                    className="w-full py-4 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-lg shadow-primary/25"
                                >
                                    <FaMagic /> Generate Badge
                                </button>
                            </motion.div>
                        )}


                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center h-64">
                                <FaSpinner className="w-12 h-12 animate-spin mb-4" style={{ color: primaryColor }} />
                                <h3 className="text-lg font-bold text-text-main">Creating Magic...</h3>
                            </div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="success"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center bg-bg-tertiary border border-border-color p-8 rounded-2xl"
                            >
                                <FaCheckCircle className="text-5xl mx-auto mb-4" style={{ color: '#22c55e' }} />
                                <h2 className="text-2xl font-bold mb-2 text-text-main">It's Ready!</h2>
                                <p className="text-text-muted mb-6">Download your badge and share it with the world.</p>

                                <button
                                    onClick={handleDownload}
                                    className="w-full py-4 bg-text-main text-bg-primary font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-4 shadow-lg"
                                >
                                    <FaDownload /> Download Image
                                </button>

                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-4 bg-bg-tertiary border border-border-color rounded-xl text-text-main hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white transition-colors shadow-sm"><FaLinkedin className="text-xl" /></button>
                                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-4 bg-bg-tertiary border border-border-color rounded-xl text-text-main hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:text-white transition-colors shadow-sm"><FaTwitter className="text-xl" /></button>
                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-4 bg-bg-tertiary border border-border-color rounded-xl text-text-main hover:bg-[#25D366] hover:border-[#25D366] hover:text-white transition-colors shadow-sm"><FaWhatsapp className="text-xl" /></button>
                                </div>

                                <button onClick={() => setStep(1)} className="mt-6 text-xs text-text-muted hover:text-text-main underline">Create Another</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT PANEL: PREVIEW */}
            <div className="hidden md:flex flex-1 relative items-center justify-center bg-bg-secondary p-12 overflow-hidden transition-colors duration-300">
                <div className="relative z-10 h-[85vh] aspect-[27/40] max-w-[600px] shadow-2xl rounded-2xl overflow-hidden border border-border-color bg-neutral-900 group">
                    {step === 4 && generatedImage ? (
                        <img src={generatedImage} alt="Final" className="w-full h-full object-contain" />
                    ) : (
                        <div className="relative w-full h-full fabric-preview-wrapper">
                            {/* Force Fabric to scale down visually using CSS */}
                            <style>{`
                                .fabric-preview-wrapper .canvas-container {
                                    width: 100% !important;
                                    height: 100% !important;
                                }
                                .fabric-preview-wrapper canvas {
                                    width: 100% !important;
                                    height: 100% !important;
                                }
                            `}</style>
                            <canvas ref={canvasRef} className="w-full h-full object-contain bg-neutral-900" />
                            {!photoPreview && (
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white/70 text-xs px-3 py-1.5 rounded-full border border-white/10 pointer-events-none flex items-center gap-2">
                                    <FaCamera /> Upload Photo to see preview
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicEventPage;
