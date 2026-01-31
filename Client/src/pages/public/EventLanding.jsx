import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PublicEventPage = () => {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Identity, 2: Upload, 3: Preview, 4: Lead, 5: Result

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
    const [renderProgress, setRenderProgress] = useState(0);

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
            // Simulate processing
            setRenderProgress(10);
            setTimeout(() => setStep(3), 800);
        }
    };

    // Canvas Generation Logic
    const generatePoster = async (quality = 'low') => {
        if (!event || !canvasRef.current || !photoPreview) return;

        const ctx = canvasRef.current.getContext('2d');
        const { config } = event;

        // 1. Determine Background (Role specific or default)
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

        // Resolution: Low for preview, High for download
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

            // Draw image centered/covered
            // Using a simple cover algorithm
            const imgRatio = photoImg.width / photoImg.height;
            const targetSize = radius * 2;
            let renderW = targetSize;
            let renderH = targetSize;

            if (imgRatio > 1) {
                renderW = targetSize * imgRatio;
            } else {
                renderH = targetSize / imgRatio;
            }

            const dx = x - (renderW / 2); // Center x
            const dy = y - (renderH / 2); // Center y

            ctx.drawImage(photoImg, dx, dy, renderW, renderH);
            ctx.restore();
        }

        // 3. Draw Text
        const { typography } = config;
        ctx.textAlign = 'center'; // Assuming center alignment for now

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

    // Effect to render preview when entering Step 3
    useEffect(() => {
        if (step === 3) {
            generatePoster('low');
        }
    }, [step, formData.role, photoPreview]);

    const handleHighRes = async () => {
        // Validation handles mainly in UI, but check mobile here
        if (!formData.mobile || !formData.designation) {
            alert('Please fill in required fields');
            return;
        }

        setStep(5); // Show success/generating

        // Delay slightly for UI transition
        // Delay slightly for UI transition
        setTimeout(async () => {
            try {
                // 1. Upload User Photo if exists
                let photoUrl = null;
                if (formData.photo) {
                    const uploadData = new FormData();
                    uploadData.append('photo', formData.photo);
                    const uploadRes = await axios.post('/api/events/poster/upload', uploadData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    photoUrl = uploadRes.data.url;
                }

                // 2. Generate High Res Poster
                const genRes = await axios.post(`/api/events/${slug}/generate`, {
                    ...formData,
                    photoUrl // Send the cloud URL, not the file object
                });

                const highResUrl = genRes.data.url;
                setGeneratedImage(highResUrl);

                // 3. Save Lead with final URL
                await axios.post(`/api/events/${slug}/lead`, {
                    ...formData,
                    generatedImageUrl: highResUrl,
                    photoUrl // optional: save user photo url too
                });

            } catch (error) {
                console.error("High Res Generation Failed", error);
                alert("Failed to generate high-res poster. Please try again.");
                setStep(4); // Go back
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

    if (loading) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${event.config.roles?.[0]?.color || '#4f46e5'}, #000)` }}></div>

            <div className="max-w-md w-full relative z-10">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">{event.title}</h1>
                    <p className="text-sm text-gray-500">Create your official badge</p>
                </header>

                <AnimatePresence mode='wait'>

                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-gray-800/80 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-xl"
                        >
                            <h2 className="text-xl font-semibold mb-4">Who are you?</h2>

                            {event.config.roles?.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-400 uppercase mb-2">I am a...</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {event.config.roles.map(r => (
                                            <button
                                                key={r.label}
                                                onClick={() => setFormData({ ...formData, role: r.label })}
                                                className={`px-4 py-2 rounded-lg text-sm transition-all border ${formData.role === r.label ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Full Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        maxLength={event.config.validation.nameLimit}
                                        onChange={handleInputChange}
                                        placeholder="Enter your name"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Company / Organization</label>
                                    <input
                                        name="company"
                                        value={formData.company}
                                        maxLength={event.config.validation.companyLimit}
                                        onChange={handleInputChange}
                                        placeholder="Where do you work?"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.name || !formData.company}
                                className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next &rarr;
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: UPLOAD */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-gray-800/80 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-xl text-center"
                        >
                            <h2 className="text-xl font-semibold mb-2">Upload Photo</h2>
                            <p className="text-gray-400 text-sm mb-6">A clear selfie or headshot works best.</p>

                            <label className="block w-full border-2 border-dashed border-gray-600 rounded-2xl p-8 cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition-all group">
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                <div className="text-4xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">📸</div>
                                <div className="text-sm font-medium">Tap to Select Photo</div>
                            </label>

                            <button onClick={() => setStep(1)} className="mt-6 text-gray-500 text-sm hover:text-white">Back</button>
                        </motion.div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-64 aspect-[9/16] bg-black rounded-lg shadow-2xl overflow-hidden mb-6 border border-gray-700">
                                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                            </div>

                            <div className="w-full flex gap-3">
                                <button onClick={() => setStep(1)} className="flex-1 bg-gray-700 py-3 rounded-xl font-medium text-sm">Edit Text</button>
                                <button onClick={() => setStep(2)} className="flex-1 bg-gray-700 py-3 rounded-xl font-medium text-sm">Change Photo</button>
                            </div>

                            <button
                                onClick={() => setStep(4)}
                                className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/50"
                            >
                                Get High-Res Poster
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 4: LEAD CAPTURE */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="bg-gray-800/80 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-xl"
                        >
                            <h2 className="text-xl font-semibold mb-2">Final Step</h2>
                            <p className="text-gray-400 text-sm mb-6">Where should we send your updates?</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Designation / Job Title</label>
                                    <input
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleInputChange}
                                        placeholder="e.g. CEO, Developer"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Mobile Number</label>
                                    <input
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        placeholder="+91 99999 99999"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleHighRes}
                                disabled={!formData.mobile || !formData.designation}
                                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-xl disabled:opacity-50"
                            >
                                Unlock Download
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {step === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            {!generatedImage ? (
                                <div className="py-20">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400">Rendering High-Res (300DPI)...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative w-64 aspect-[9/16] bg-black rounded-lg shadow-2xl overflow-hidden mb-6 mx-auto border border-gray-700">
                                        <img src={generatedImage} alt="Final Poster" className="w-full h-full object-contain" />
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-2">Poster Ready!</h2>
                                    <p className="text-gray-400 text-sm mb-6">Share it with your network.</p>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleDownload}
                                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            Download Image
                                        </button>

                                        <div className="flex gap-3">
                                            <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700" onClick={() => window.open(`whatsapp://send?text=Check out my badge for ${event.title}!`, '_blank')}>
                                                WhatsApp
                                            </button>
                                            <button className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Link Copied!'))}>
                                                Copy Link
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Sponsors Footer */}
            {event.config.sponsors?.length > 0 && step !== 3 && (
                <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent flex justify-center gap-6 pointer-events-none z-0">
                    {event.config.sponsors.map((s, i) => s.visible && (
                        <img key={i} src={s.imageUrl} alt="Sponsor" className="h-8 object-contain opacity-60 grayscale" />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublicEventPage;
