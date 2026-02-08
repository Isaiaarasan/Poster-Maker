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
            height: 1920,
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

            // 1. Determine Background
            let bgUrl = config.backgroundImageUrl;
            if (formData.role) {
                const roleConfig = config.roles?.find(r => r.label === formData.role);
                if (roleConfig && roleConfig.backgroundImageUrl) {
                    bgUrl = roleConfig.backgroundImageUrl;
                }
            }

            // Load Background
            try {
                // We use utility to load image to ensure cors
                const img = await new Promise((resolve) => {
                    const imgEl = new Image();
                    imgEl.crossOrigin = 'anonymous';
                    imgEl.src = bgUrl;
                    imgEl.onload = () => resolve(new fabricInstance.Image(imgEl));
                    imgEl.onerror = () => resolve(null);
                });

                if (img) {
                    // Make sure it covers the canvas
                    img.scaleToWidth(1080);
                    if (img.getScaledHeight() < 1920) img.scaleToHeight(1920);
                    fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
                }
            } catch (e) {
                console.error("BG Load Error", e);
            }

            // 2. Load Photo (Legacy Coordinate System Support)
            if (config.coordinates.photo && photoPreview) {
                try {
                    const { x, y, radius, shape } = config.coordinates.photo;
                    const photoImg = await new Promise((resolve) => {
                        const imgEl = new Image();
                        imgEl.src = photoPreview;
                        imgEl.onload = () => resolve(new fabricInstance.Image(imgEl));
                        imgEl.onerror = () => resolve(null);
                    });

                    if (photoImg) {
                        // Create Clip Path
                        let clipPath;
                        const size = radius * 2;

                        // Center of the object is handled differently in Fabric
                        // We set originX/Y to center for easier positioning

                        if (shape === 'square') {
                            clipPath = new fabricInstance.Rect({
                                width: size,
                                height: size,
                                rx: 20, ry: 20, // Rounded corners default
                                originX: 'center',
                                originY: 'center',
                            });
                        } else {
                            clipPath = new fabricInstance.Circle({
                                radius: radius,
                                originX: 'center',
                                originY: 'center',
                            });
                        }

                        // Scale photo to cover the area
                        const photoRatio = photoImg.width / photoImg.height;
                        if (photoRatio > 1) {
                            photoImg.scaleToHeight(size);
                        } else {
                            photoImg.scaleToWidth(size);
                        }

                        photoImg.set({
                            left: x,
                            top: y,
                            originX: 'center',
                            originY: 'center',
                            clipPath: clipPath
                        });

                        fabricCanvas.add(photoImg);
                    }
                } catch (e) { console.error("Photo Error", e); }
            }

            // 3. Load Text Fields (Legacy System)
            const fields = Object.keys(config.coordinates).filter(k => k !== 'photo');
            fields.forEach(key => {
                let text = formData[key] || '';
                // Fallback to static config
                if (!text && config.posterElements && config.posterElements[key]) {
                    text = config.posterElements[key];
                }
                if (!text) return;

                const style = config.typography[key] || { size: 24, color: '#000000' };
                // transform casing
                // omitted strict casing logic for brevity but can add back

                const textObj = new fabricInstance.Text(text, {
                    left: config.coordinates[key].x,
                    top: config.coordinates[key].y,
                    fontSize: style.size,
                    fill: style.color,
                    fontFamily: style.fontFamily || config.typography.fontFamily || 'Arial',
                    fontWeight: style.weight === 'bold' ? 'bold' : 'normal',
                    textAlign: style.align || 'center',
                    originX: style.align === 'left' ? 'left' : (style.align === 'right' ? 'right' : 'center'),
                    originY: 'middle'
                });

                fabricCanvas.add(textObj);
            });

            // 4. QR Code
            if (config.posterElements?.qrEnabled) {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;
                const qrImg = await new Promise((resolve) => {
                    const imgEl = new Image();
                    imgEl.crossOrigin = 'anonymous';
                    imgEl.src = qrUrl;
                    imgEl.onload = () => resolve(new fabricInstance.Image(imgEl));
                    imgEl.onerror = () => resolve(null);
                });
                if (qrImg) {
                    qrImg.set({
                        left: 1080 - 250 - 50,
                        top: 1920 - 250 - 50,
                        scaleX: 250 / qrImg.width,
                        scaleY: 250 / qrImg.height
                    });
                    fabricCanvas.add(qrImg);
                }
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
        if (!formData.mobile || !formData.designation) {
            alert("Please complete safely critical information to proceed.");
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

            // Convert Data URL to Blob
            const res = await fetch(highResDataUrl);
            const blob = await res.blob();

            // 2. Upload Final Poster
            const posterData = new FormData();
            posterData.append('photo', blob, 'poster.png'); // Re-using the 'photo' endpoint for simplicity, or we can make a new one

            // We need to upload this to a persisted location
            // Using the existing upload endpoint which works for temp uploads, 
            // but ideally we should have a `upload-generated` endpoint.
            // Let's use the existing one for now, it returns a URL.
            const uploadRes = await axios.post('/api/events/poster/upload', posterData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const finalPosterUrl = uploadRes.data.url;
            setGeneratedImage(finalPosterUrl);

            // 3. Submit Lead with the URL
            await axios.post(`/api/events/${slug}/lead`, {
                ...formData,
                generatedImageUrl: finalPosterUrl,
                photoUrl: null // We handled generation client side
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
