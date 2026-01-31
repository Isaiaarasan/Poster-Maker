import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUpload, FaDownload, FaLinkedin, FaTwitter, FaWhatsapp, FaCamera, FaSpinner, FaCheckCircle
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

                // Load Font
                if (res.data.config?.typography?.fontFamily) {
                    const link = document.createElement('link');
                    link.href = `https://fonts.googleapis.com/css2?family=${res.data.config.typography.fontFamily.replace(' ', '+')}:wght@400;700&display=swap`;
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                }
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
            if (step === 1) setStep(1); // Stay on step 1 but refresh preview
        }
    };

    // Canvas Generation Logic (Client Side Preview)
    const generatePoster = async (quality = 'low') => {
        if (!event || !canvasRef.current || !photoPreview) return;

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
            console.error("BG Load Error", e);
            return;
        }

        const width = 1080;
        const height = 1920;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        ctx.drawImage(bgImg, 0, 0, width, height);

        // 2. Draw Photo
        if (config.coordinates.photo) {
            const { x, y, radius } = config.coordinates.photo;
            const photoImg = new Image();
            photoImg.src = photoPreview;
            await new Promise(resolve => photoImg.onload = resolve);

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
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
        }

        // 3. Draw Generic Text Fields
        const { typography, coordinates } = config;
        ctx.textAlign = 'center';

        Object.keys(coordinates).forEach(key => {
            if (key === 'photo') return;
            if (!formData[key]) return; // Skip if user hasn't typed anything

            const style = typography[key] || { size: 24, color: '#000000' };

            ctx.font = `${key === 'name' ? '700' : '400'} ${style.size}px "${typography.fontFamily}"`;
            ctx.fillStyle = style.color;
            ctx.fillText(formData[key], coordinates[key].x, coordinates[key].y);
        });

        // 4. Watermark
        if (config.watermarkUrl) {
            const wmImg = new Image();
            wmImg.crossOrigin = "anonymous";
            wmImg.src = config.watermarkUrl;
            await new Promise(r => { wmImg.onload = r; wmImg.onerror = r; });
            ctx.drawImage(wmImg, 0, 0, width, height);
        }

        // Return data URL if needed
        return canvasRef.current.toDataURL('image/jpeg', 0.8);
    };

    // Auto-update preview
    useEffect(() => {
        if (canvasRef.current && photoPreview) {
            // Debounce slightly for text typing
            const timer = setTimeout(() => generatePoster('low'), 100);
            return () => clearTimeout(timer);
        }
    }, [formData, photoPreview]);

    const handleHighResWrapper = async (e) => {
        e.preventDefault();

        // Validation for critical fields
        if (!formData.name || !formData.company) {
            alert("Please enter your name and company.");
            return;
        }
        if (!photoPreview) {
            alert("Please upload a photo.");
            return;
        }

        // Move to Lead Capture Step
        setStep(2);
    };

    const submitLeadAndGenerate = async () => {
        // Validate Lead Info
        if (!formData.mobile || !formData.designation) {
            alert("Please complete safely critical information to proceed.");
            return;
        }

        setIsGenerating(true);
        setStep(3); // Show loading state

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

            // Send all form data to backend
            const genRes = await axios.post(`/api/events/${slug}/generate`, {
                ...formData,
                photoUrl
            });

            const highResUrl = genRes.data.url;
            setGeneratedImage(highResUrl);

            // Save Lead
            await axios.post(`/api/events/${slug}/lead`, {
                ...formData,
                generatedImageUrl: highResUrl,
                photoUrl
            });

            setStep(4); // Success

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

    const handleShare = (network) => {
        const text = `Check out my official badge for ${event.title}! #Event #Badge`;
        const url = window.location.href; // In real app, this would be specific share link

        if (network === 'linkedin') { // LinkedIn
            window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)} ${encodeURIComponent(url)}`, '_blank');
        } else if (network === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        } else if (network === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        }
    }

    if (loading) return (
        <div className="h-screen bg-bg-primary flex items-center justify-center">
            <FaSpinner className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    if (!event) return <div className="h-screen bg-black text-white flex items-center justify-center">Event not found</div>;

    const fields = Object.keys(event.config.coordinates).filter(k => k !== 'photo');

    return (
        <div className="min-h-screen bg-bg-primary text-white font-sans flex flex-col md:flex-row overflow-hidden absolute inset-0">

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

            {/* LEFT PANEL: INPUT & PROCESS */}
            <div className="w-full md:w-1/2 p-6 md:p-12 relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">

                {/* Branding */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        {event.title}
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">Official Badge Generator</p>
                </div>

                <AnimatePresence mode='wait'>

                    {/* STEP 1: MAIN INPUTS */}
                    {step === 1 && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-6"
                        >
                            {/* Role Selection */}
                            {event.config.roles?.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {event.config.roles.map(r => (
                                        <button
                                            key={r.label}
                                            onClick={() => setFormData({ ...formData, role: r.label })}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${formData.role === r.label ? 'bg-primary border-primary text-white' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/30'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Identity Fields */}
                            <div className="space-y-4">
                                {fields.filter(f => ['name', 'company'].includes(f)).map(key => (
                                    <div key={key}>
                                        <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">{key}</label>
                                        <input
                                            name={key}
                                            value={formData[key] || ''}
                                            onChange={handleInputChange}
                                            placeholder={`Your ${key}`}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-2">Profile Photo</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer group">
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                        <div className="h-24 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                                            <FaCamera className="text-xl text-slate-400 group-hover:text-primary mb-1" />
                                            <div className="text-xs text-slate-400">
                                                {photoPreview ? "Change Photo" : "Upload Selfie"}
                                            </div>
                                        </div>
                                    </label>
                                    {photoPreview && (
                                        <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-white/20" />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleHighResWrapper}
                                className="mt-4 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
                            >
                                Get High-Res Poster &rarr;
                            </button>

                        </motion.div>
                    )}

                    {/* STEP 2: LEAD CAPTURE (Gated) */}
                    {step === 2 && (
                        <motion.div
                            key="lead"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-bg-tertiary border border-white/10 p-6 rounded-2xl"
                        >
                            <h3 className="text-lg font-bold mb-4">Final Step</h3>
                            <p className="text-sm text-slate-400 mb-6">Complete your profile to download the high-resolution event badge.</p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Mobile Number</label>
                                    <input
                                        name="mobile"
                                        value={formData.mobile || ''}
                                        onChange={handleInputChange}
                                        type="tel"
                                        placeholder="+91..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Designation / Job Title</label>
                                    <input
                                        name="designation"
                                        value={formData.designation || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g. CEO, Developer"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white">Back</button>
                                <button onClick={submitLeadAndGenerate} className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200">Generate Now</button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: LOADING */}
                    {step === 3 && (
                        <motion.div className="flex flex-col items-center justify-center py-20">
                            <FaSpinner className="w-12 h-12 text-primary animate-spin mb-4" />
                            <h3 className="text-xl font-bold">Processing High-Res Image...</h3>
                            <p className="text-slate-400 text-sm mt-2">Adding watermark & magic</p>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaCheckCircle className="text-3xl" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
                            <p className="text-slate-400 mb-8">Your official badge is ready to share.</p>

                            <button onClick={handleDownload} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 mb-6">
                                <FaDownload /> Download Image
                            </button>

                            <div className="flex gap-2 justify-center">
                                <button onClick={() => handleShare('linkedin')} className="p-4 bg-[#0077b5] rounded-xl text-white hover:brightness-110"><FaLinkedin className="text-lg" /></button>
                                <button onClick={() => handleShare('twitter')} className="p-4 bg-[#1DA1F2] rounded-xl text-white hover:brightness-110"><FaTwitter className="text-lg" /></button>
                                <button onClick={() => handleShare('whatsapp')} className="p-4 bg-[#25D366] rounded-xl text-white hover:brightness-110"><FaWhatsapp className="text-lg" /></button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* RIGHT PANEL: LIVE PREVIEW (Desktop Only) */}
            <div className="hidden md:flex w-1/2 bg-[#050510] relative items-center justify-center p-8">
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl"></div>
                <div className="relative z-10 w-[400px] h-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/5">
                    {step === 4 && generatedImage ? (
                        <img src={generatedImage} alt="Final" className="w-full h-auto" />
                    ) : (
                        <>
                            <canvas ref={canvasRef} className="w-full h-auto bg-white/5" />
                            {!photoPreview && <div className="absolute inset-0 flex items-center justify-center text-white/20 pointer-events-none">Live Preview</div>}
                        </>
                    )}
                </div>
            </div>

            {/* MOBILE PREVIEW MODAL? Or just assume standard view is fine. We stick to split layout logic or responsive vertical */}
        </div>
    );
};

export default PublicEventPage;
