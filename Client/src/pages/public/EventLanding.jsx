import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PublicEventPage = () => {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        designation: '',
        mobile: '',
        role: '',
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);

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
            setTimeout(() => setStep(3), 500); // Smooth auto-advance
        }
    };

    // Canvas Generation Logic
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
        await new Promise(resolve => bgImg.onload = resolve);

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

        // 3. Draw Text
        const { typography } = config;
        ctx.textAlign = 'center';

        if (formData.name && config.coordinates.name) {
            ctx.font = `700 ${typography.name.size}px "${typography.fontFamily}"`;
            ctx.fillStyle = typography.name.color;
            ctx.fillText(formData.name, config.coordinates.name.x, config.coordinates.name.y);
        }

        if (formData.company && config.coordinates.company) {
            ctx.font = `400 ${typography.company.size}px "${typography.fontFamily}"`;
            ctx.fillStyle = typography.company.color;
            ctx.fillText(formData.company, config.coordinates.company.x, config.coordinates.company.y);
        }

        if (formData.designation && config.coordinates.designation) {
            ctx.font = `400 ${typography.designation.size}px "${typography.fontFamily}"`;
            ctx.fillStyle = typography.designation.color;
            ctx.fillText(formData.designation, config.coordinates.designation.x, config.coordinates.designation.y);
        }

        // 4. Watermark
        if (config.watermarkUrl) {
            const wmImg = new Image();
            wmImg.crossOrigin = "anonymous";
            wmImg.src = config.watermarkUrl;
            await new Promise(r => { wmImg.onload = r; wmImg.onerror = r; });
            ctx.drawImage(wmImg, 0, 0, width, height);
        }

        return canvasRef.current.toDataURL(quality === 'high' ? 'image/png' : 'image/jpeg', quality === 'high' ? 1.0 : 0.5);
    };

    useEffect(() => {
        if (step === 3) {
            generatePoster('low');
        }
    }, [step, formData.role, photoPreview]);

    const handleHighRes = async () => {
        if (!formData.mobile || !formData.designation) {
            alert('Please fill in required fields');
            return;
        }

        setStep(5);

        setTimeout(async () => {
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

            } catch (error) {
                console.error("High Res Generation Failed", error);
                alert("Failed to generate high-res poster. Please try again.");
                setStep(4);
            }
        }, 500);
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.download = `Poster-${formData.name}.png`;
            link.href = generatedImage;
            link.click();
        }
    };

    if (loading) return (
        <div className="h-screen bg-bg-primary flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!event) return <div className="h-screen bg-black text-white flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-bg-primary text-white font-sans flex flex-col md:flex-row overflow-hidden relative">

            {/* BACKGROUND ASSETS */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary rounded-full blur-[150px] opacity-20 animate-pulse pointer-events-none"></div>

            {/* LEFT PANEL: Branding & Form */}
            <div className="w-full md:w-1/2 p-8 md:p-12 relative z-10 flex flex-col justify-center min-h-screen">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <header className="mb-12">
                        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest mb-4 border border-white/5">
                            Official Event Badge
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                {event.title}
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-sm">
                            Create your personalized digital access pass in seconds.
                        </p>
                    </header>

                    <AnimatePresence mode='wait'>
                        {/* STEP 1: IDENTITY */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6 max-w-md"
                            >
                                <div className="space-y-4">
                                    {event.config.roles?.length > 0 && (
                                        <div className="flex gap-2 mb-6">
                                            {event.config.roles.map(r => (
                                                <button
                                                    key={r.label}
                                                    onClick={() => setFormData({ ...formData, role: r.label })}
                                                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${formData.role === r.label
                                                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative mb-6">
                                        <label className="block text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2">Full Name</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            maxLength={event.config.validation.nameLimit}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:bg-black/60 focus:border-primary transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div className="relative mb-6">
                                        <label className="block text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2">Company</label>
                                        <input
                                            name="company"
                                            value={formData.company}
                                            maxLength={event.config.validation.companyLimit}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:bg-black/60 focus:border-primary transition-all"
                                            placeholder="Company Name"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.name || !formData.company}
                                    className="w-full inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue to Photo &rarr;
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 2: UPLOAD */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-md"
                            >
                                <label className="block w-full aspect-square md:aspect-video border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-white/5 transition-all group relative overflow-hidden">
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />

                                    <div className="absolute inset-0 bg-indigo-500/10 scale-0 group-hover:scale-100 transition-transform rounded-3xl duration-500"></div>

                                    <div className="relative z-10 text-center p-8">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Upload Profile Photo</h3>
                                        <p className="text-slate-400 text-sm">Supports JPG, PNG (Max 5MB)</p>
                                    </div>
                                </label>
                                <button onClick={() => setStep(1)} className="w-full mt-4 text-slate-400 hover:text-white transition-colors py-2">Back</button>
                            </motion.div>
                        )}

                        {/* STEP 3 & 4: DETAILS & PREVIEW Logic */}
                        {(step === 3 || step === 4) && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-md space-y-6"
                            >
                                <h3 className="text-2xl font-bold">Final Details</h3>
                                <div className="space-y-4">
                                    <div className="relative mb-6">
                                        <label className="block text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2">Designation</label>
                                        <input
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleInputChange}
                                            placeholder="e.g. CEO, Developer"
                                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:bg-black/60 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div className="relative mb-6">
                                        <label className="block text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2">WhatsApp Number</label>
                                        <input
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleInputChange}
                                            placeholder="+91..."
                                            className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:bg-black/60 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setStep(2)} className="flex-1 px-6 py-4 rounded-xl font-semibold border border-white/10 hover:bg-white/5 text-white transition-all">Back</button>
                                    <button
                                        onClick={handleHighRes}
                                        disabled={!formData.mobile || !formData.designation}
                                        className="flex-1 px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-secondary text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] text-center disabled:opacity-50"
                                    >
                                        Generate Badge
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: SUCCESS */}
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="max-w-md text-center"
                            >
                                {!generatedImage ? (
                                    <div className="py-20 flex flex-col items-center">
                                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                                        <h3 className="text-xl font-bold animate-pulse">Forging Digital Identity...</h3>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                            Badge Ready!
                                        </h2>
                                        <p className="text-slate-400">Your pass has been generated securely.</p>

                                        <div className="grid grid-cols-1 gap-3">
                                            <button onClick={handleDownload} className="w-full py-4 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition-colors">
                                                Download Image
                                            </button>
                                            <div className="flex gap-3">
                                                <button className="flex-1 py-4 rounded-xl font-bold bg-[#25D366] hover:bg-[#128C7E] text-white transition-colors" onClick={() => window.open(`whatsapp://send?text=Just got my badge for ${event.title}!`, '_blank')}>
                                                    Share
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* RIGHT PANEL: Live Preview */}
            <div className="hidden md:flex w-1/2 bg-[#050510] relative items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl"></div>

                {/* Floating Preview Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                    animate={{
                        opacity: step >= 3 || generatedImage ? 1 : 0.5,
                        scale: step >= 3 || generatedImage ? 1 : 0.9,
                        rotateY: step >= 3 ? 0 : -10
                    }}
                    transition={{ type: "spring", stiffness: 100 }}
                    style={{ perspective: 1000 }}
                    className="relative z-10 w-full max-w-[400px] aspect-[9/16] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                >
                    {/* Placeholder for before upload */}
                    {!photoPreview && !generatedImage && (
                        <div className="absolute inset-0 bg-white/5 flex flex-col items-center justify-center text-white/20">
                            <div className="text-6xl mb-4">🔮</div>
                            <p className="font-mono text-sm tracking-widest uppercase">Preview Mode</p>
                        </div>
                    )}

                    {/* Canvas / Final Image */}
                    {generatedImage ? (
                        <img src={generatedImage} alt="Final" className="w-full h-full object-cover" />
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className={`w-full h-full object-contain ${!photoPreview && 'opacity-0'}`}
                        />
                    )}
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute bottom-10 right-10 text-right opacity-30">
                    <p className="font-mono text-xs text-indigo-400">SECURE RENDER_PIPELINE_V1</p>
                    <p className="font-mono text-xs text-indigo-400">300 DPI // CMYK READY</p>
                </div>
            </div>
        </div>
    );
};

export default PublicEventPage;
