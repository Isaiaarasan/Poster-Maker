import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUpload, FaDownload, FaLinkedin, FaTwitter, FaWhatsapp, FaCamera, FaSpinner, FaCheckCircle, FaMagic
} from 'react-icons/fa';

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

    // Canvas Generation Logic (Same as before but debounced and efficient)
    const generatePoster = async () => {
        if (!event || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const { config } = event;

        // 1. Determine Background
        let bgUrl = config.backgroundImageUrl;
        if (formData.role) {
            const roleConfig = config.roles?.find(r => r.label === formData.role);
            if (roleConfig && roleConfig.backgroundImageUrl) {
                bgUrl = roleConfig.backgroundImageUrl;
            }
        }

        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.src = bgUrl;

        try {
            await new Promise((resolve, reject) => {
                bgImg.onload = resolve;
                bgImg.onerror = reject;
            });
        } catch (e) {
            return;
        }

        const width = 1080;
        const height = 1920;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        ctx.drawImage(bgImg, 0, 0, width, height);

        // 2. Draw Photo
        if (config.coordinates.photo && photoPreview) {
            const { x, y, radius, shape } = config.coordinates.photo;
            const photoImg = new Image();
            photoImg.src = photoPreview;
            try {
                await new Promise((resolve, reject) => {
                    photoImg.onload = resolve;
                    photoImg.onerror = reject;
                });

                ctx.save();
                ctx.beginPath();

                if (shape === 'square') {
                    const size = radius * 2;
                    const r = 40;
                    const lx = x - radius;
                    const ly = y - radius;
                    ctx.moveTo(lx + r, ly);
                    ctx.lineTo(lx + size - r, ly);
                    ctx.quadraticCurveTo(lx + size, ly, lx + size, ly + r);
                    ctx.lineTo(lx + size, ly + size - r);
                    ctx.quadraticCurveTo(lx + size, ly + size, lx + size - r, ly + size);
                    ctx.lineTo(lx + r, ly + size);
                    ctx.quadraticCurveTo(lx, ly + size, lx, ly + size - r);
                    ctx.lineTo(lx, ly + r);
                    ctx.quadraticCurveTo(lx, ly, lx + r, ly);
                } else {
                    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
                }

                ctx.closePath();
                ctx.clip();

                const imgRatio = photoImg.width / photoImg.height;
                const targetSize = radius * 2;
                let renderW = targetSize;
                let renderH = targetSize;

                if (imgRatio > 1) {
                    renderW = targetSize * imgRatio;
                } else {
                    renderH = targetSize / imgRatio;
                }

                const dx = x - (renderW / 2);
                const dy = y - (renderH / 2);

                ctx.drawImage(photoImg, dx, dy, renderW, renderH);
                ctx.restore();
            } catch (e) {
                console.error("Error loading photo", e);
            }
        }

        // 3. Draw Text
        const { typography, coordinates, posterElements } = config;

        Object.keys(coordinates).forEach(key => {
            if (key === 'photo') return;

            let text = formData[key] || '';
            if (!text && posterElements && posterElements[key]) {
                text = posterElements[key];
            }

            if (!text) return;

            const style = typography[key] || { size: 24, color: '#000000' };

            if (style.casing === 'uppercase') text = text.toUpperCase();
            if (style.casing === 'lowercase') text = text.toLowerCase();

            const weight = style.weight === 'bold' ? 'bold' : (style.weight === '800' ? '800' : 'normal');
            const family = style.fontFamily || typography.fontFamily || 'Arial';
            ctx.font = `${weight} ${style.size}px "${family}"`;

            ctx.textAlign = style.align || 'center';
            ctx.textBaseline = 'middle';

            if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                const textHeight = style.size;
                const padding = style.size * 0.2;

                let tx = coordinates[key].x;
                const ty = coordinates[key].y - (textHeight / 2);

                if (ctx.textAlign === 'center') tx -= (textWidth / 2);
                if (ctx.textAlign === 'right') tx -= textWidth;

                ctx.fillStyle = style.backgroundColor;
                ctx.fillRect(tx - padding, ty - padding + (textHeight * 0.1), textWidth + (padding * 2), textHeight + (padding * 1));
            }

            ctx.fillStyle = style.color;
            ctx.fillText(text, coordinates[key].x, coordinates[key].y);
        });

        // 3.5 QR Code
        if (posterElements?.qrEnabled) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;
            const qrImg = new Image();
            qrImg.crossOrigin = "anonymous";
            qrImg.src = qrUrl;
            try {
                await new Promise((r) => { qrImg.onload = r; qrImg.onerror = r; });
                const qrSize = 250;
                ctx.drawImage(qrImg, width - qrSize - 50, height - qrSize - 50, qrSize, qrSize);
            } catch (e) {
                console.error("QR Load Error", e);
            }
        }

        // 4. Watermark
        if (config.watermarkUrl) {
            const wmImg = new Image();
            wmImg.crossOrigin = "anonymous";
            wmImg.src = config.watermarkUrl;
            await new Promise(r => { wmImg.onload = r; wmImg.onerror = r; });
            ctx.drawImage(wmImg, 0, 0, width, height);
        }
    };

    useEffect(() => {
        if (canvasRef.current && event) {
            const timer = setTimeout(() => generatePoster(), 100);
            return () => clearTimeout(timer);
        }
    }, [formData, photoPreview, event]);

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
        if (!formData.mobile || !formData.designation) {
            alert("Please complete safely critical information to proceed.");
            return;
        }
        setIsGenerating(true);
        setStep(3);

        try {
            let photoUrl = null;
            if (formData.photo) {
                const uploadData = new FormData();
                uploadData.append('photo', formData.photo);
                const uploadRes = await axios.post('/api/events/poster/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                photoUrl = uploadRes.data.url;
            }

            const genRes = await axios.post(`/api/events/${slug}/generate`, {
                ...formData,
                photoUrl
            });

            const highResUrl = genRes.data.url;
            setGeneratedImage(highResUrl);

            await axios.post(`/api/events/${slug}/lead`, {
                ...formData,
                generatedImageUrl: highResUrl,
                photoUrl
            });

            setStep(4);
        } catch (error) {
            console.error("High Res Generation Failed", error);
            alert("Failed to generate high-res poster. Please try again.");
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

    return (
        <div className="min-h-screen bg-bg-primary text-white font-sans flex flex-col md:flex-row overflow-hidden relative">

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[150px] rounded-full"></div>
            </div>

            {/* LEFT PANEL: INPUT */}
            <div className="w-full md:w-5/12 p-6 md:p-12 relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar backdrop-blur-sm bg-black/20 border-r border-white/5">
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
                        {event.title}
                    </h1>
                    <p className="text-sm text-slate-400">Create your official event badge in seconds.</p>
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
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3">Select Role</label>
                                    <div className="flex gap-3 flex-wrap">
                                        {event.config.roles.map(r => (
                                            <button
                                                key={r.label}
                                                onClick={() => setFormData({ ...formData, role: r.label })}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${formData.role === r.label ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inputs */}
                            <div className="space-y-4">
                                {fields.filter(f => ['name', 'company'].includes(f)).map(key => (
                                    <div key={key}>
                                        <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">{key}</label>
                                        <input
                                            name={key}
                                            value={formData[key] || ''}
                                            onChange={handleInputChange}
                                            placeholder={`Enter your ${key}`}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-medium"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Profile Photo</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer group relative overflow-hidden rounded-xl">
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                        <div className="h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all bg-white/5">
                                            <FaCamera className="text-2xl text-slate-400 group-hover:text-white" />
                                            <div className="text-xs text-slate-400 group-hover:text-white font-medium">
                                                {photoPreview ? "Change Photo" : "Upload Selfie"}
                                            </div>
                                        </div>
                                    </label>
                                    {photoPreview && (
                                        <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-primary/50 shadow-xl">
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleHighResWrapper}
                                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-lg"
                            >
                                <FaMagic /> Generate Poster
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="lead"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl"
                        >
                            <h3 className="text-xl font-bold mb-2">Final Step</h3>
                            <p className="text-sm text-slate-400 mb-6">Enter your details to receive the high-quality version.</p>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Mobile Number</label>
                                    <input
                                        name="mobile"
                                        value={formData.mobile || ''}
                                        onChange={handleInputChange}
                                        type="tel"
                                        placeholder="+91..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Job Title</label>
                                    <input
                                        name="designation"
                                        value={formData.designation || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g. CEO"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5">Back</button>
                                <button onClick={submitLeadAndGenerate} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transaction-all shadow-lg shadow-white/10">Get My Badge</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <FaSpinner className="w-12 h-12 text-primary animate-spin mb-4" />
                            <h3 className="text-lg font-bold">Creating Magic...</h3>
                        </div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center bg-white/5 border border-white/10 p-8 rounded-2xl"
                        >
                            <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">It's Ready!</h2>
                            <p className="text-slate-400 mb-6">Download your badge and share it with the world.</p>

                            <button onClick={handleDownload} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 mb-4 shadow-lg shadow-white/10">
                                <FaDownload /> Download Image
                            </button>

                            <div className="flex gap-2 justify-center">
                                <button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-[#0077b5] hover:border-[#0077b5] transition-colors"><FaLinkedin className="text-xl" /></button>
                                <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-[#1DA1F2] hover:border-[#1DA1F2] transition-colors"><FaTwitter className="text-xl" /></button>
                                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-[#25D366] hover:border-[#25D366] transition-colors"><FaWhatsapp className="text-xl" /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RIGHT PANEL: PREVIEW */}
            <div className="hidden md:flex flex-1 relative items-center justify-center bg-bg-secondary p-12">
                <div className="relative z-10 w-full max-w-[500px] aspect-[9/16] shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 group">
                    {step === 4 && generatedImage ? (
                        <img src={generatedImage} alt="Final" className="w-full h-full object-contain" />
                    ) : (
                        <>
                            <canvas ref={canvasRef} className="w-full h-full object-contain bg-neutral-900" />
                            {!photoPreview && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-center p-8">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white/50">
                                        <FaMagic className="text-2xl" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Live Preview</h3>
                                    <p className="text-slate-400 text-sm">Upload your photo to see your personalized badge here instantly.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicEventPage;
