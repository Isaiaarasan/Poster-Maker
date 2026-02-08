import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // Trying v6 import style, fall back if needed

const CanvasEditor = ({ onSave, initialData }) => {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [templateName, setTemplateName] = useState('');
    const [bgImageFile, setBgImageFile] = useState(null);

    // History State
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const isHistoryProcessing = useRef(false);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        // Check if fabric is available properly
        const fabricInstance = fabric.fabric || fabric;

        const newCanvas = new fabricInstance.Canvas(canvasRef.current, {
            width: 400, // Preview size
            height: 640,
            backgroundColor: '#fff',
            preserveObjectStacking: true,
            selection: true
        });

        setCanvas(newCanvas);

        newCanvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
        newCanvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
        newCanvas.on('selection:cleared', () => setSelectedObject(null));

        // History Listener
        newCanvas.on('object:modified', saveHistory);
        newCanvas.on('object:added', (e) => {
            if (!isHistoryProcessing.current) saveHistory();
        });
        newCanvas.on('object:removed', (e) => {
            if (!isHistoryProcessing.current) saveHistory();
        });

        // Initial History Save
        // We need to wait slightly for initialization if loading initialData
        // For now, push empty state

        return () => {
            newCanvas.dispose();
        };
    }, []);

    // Save History Snapshot
    const saveHistory = () => {
        if (!canvas || isHistoryProcessing.current) return;

        const json = JSON.stringify(canvas.toJSON());

        // If we are in the middle of history, discard future states
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(json);

        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    // Undo
    const undo = () => {
        if (historyStep <= 0 || !canvas) return;
        isHistoryProcessing.current = true;

        const previousStep = historyStep - 1;
        const json = history[previousStep];

        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            setHistoryStep(previousStep);
            isHistoryProcessing.current = false;
        });
    };

    // Redo
    const redo = () => {
        if (historyStep >= history.length - 1 || !canvas) return;
        isHistoryProcessing.current = true;

        const nextStep = historyStep + 1;
        const json = history[nextStep];

        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            setHistoryStep(nextStep);
            isHistoryProcessing.current = false;
        });
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (canvas && canvas.getActiveObject() && !canvas.getActiveObject().isEditing) {
                    deleteSelected();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvas, history, historyStep]);


    // Add Placeholder Text
    const addPlaceholder = () => {
        if (!canvas) return;
        const fabricInstance = fabric.fabric || fabric;

        const text = new fabricInstance.IText('{{event_name}}', {
            left: 50,
            top: 50,
            fontFamily: 'Arial',
            fill: '#333333',
            fontSize: 24,
            fontWeight: 'bold',
            originX: 'left',
            originY: 'top',
        });

        // Add custom attribute to identify it as a placeholder
        text.set('id', 'new_variable');

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        // Trigger generic history save via object:added event
    };


    // Handle Background Image Upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !canvas) return;
        setBgImageFile(file);

        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target.result;
            const fabricInstance = fabric.fabric || fabric;

            fabricInstance.Image.fromURL(data, (img) => {
                // Scale image to fit canvas or resize canvas to fit image?
                // Let's resize canvas to aspect ratio of image but keep width fixed
                const aspectRatio = img.width / img.height;
                const newHeight = canvas.width / aspectRatio;

                canvas.setHeight(newHeight);

                img.set({
                    left: 0,
                    top: 0,
                    scaleX: canvas.width / img.width,
                    scaleY: newHeight / img.height,
                    selectable: false, // Background shouldn't be draggable
                    evented: false,
                });

                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
                // Manually trigger history save since setBackgroundImage might not fire object:added
                saveHistory();
            });
        };
        reader.readAsDataURL(file);
    };

    // Convert Canvas Objects to specific Schema format
    const handleSave = () => {
        if (!canvas) return;

        // Get all objects except background
        const objects = canvas.getObjects().map((obj) => {
            return {
                type: obj.type,
                text: obj.text,
                left: obj.left,
                top: obj.top,
                fill: obj.fill,
                fontSize: obj.fontSize,
                fontFamily: obj.fontFamily,
                fontWeight: obj.fontWeight,
                width: obj.width * obj.scaleX,
                height: obj.height * obj.scaleY,
                angle: obj.angle,
                // We assume the text content itself is the variable key if it starts with {{
                isVariable: obj.text && obj.text.startsWith('{{')
            };
        });

        // Provide data to parent
        onSave({
            name: templateName,
            objects: JSON.stringify(objects), // Full Fabric JSON could also be used: JSON.stringify(canvas.toJSON())
            bgFile: bgImageFile,
            fabricJson: JSON.stringify(canvas.toJSON()), // Save full state for restoration
            width: canvas.width,
            height: canvas.height
        }); // Send back to AdminPanel to handle API call
    };

    // Delete Selected Object
    const deleteSelected = () => {
        if (canvas && canvas.getActiveObject()) {
            canvas.remove(canvas.getActiveObject());
            canvas.renderAll();
            // object:removed will trigger history
        }
    };

    return (
        <div className="canvas-wrapper" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="card toolbar" style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ marginBottom: '1rem' }}>Toolbox</h3>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Template Name</label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g. Summer Party"
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem', display: 'flex', gap: '5px' }}>
                    <button onClick={undo} disabled={historyStep <= 0} className="btn-secondary" style={{ flex: 1, opacity: historyStep <= 0 ? 0.5 : 1 }}>↩ Undo</button>
                    <button onClick={redo} disabled={historyStep >= history.length - 1} className="btn-secondary" style={{ flex: 1, opacity: historyStep >= history.length - 1 ? 0.5 : 1 }}>↪ Redo</button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className="btn-primary" onClick={addPlaceholder}>+ Add Text</button>
                    <button className="btn-primary" style={{ background: '#ef4444' }} onClick={deleteSelected}>Delete Selected</button>
                </div>

                {selectedObject && selectedObject.type === 'i-text' && (
                    <div className="properties-panel" style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                        <h4>Properties</h4>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label>Text / Variable</label>
                            <input
                                value={selectedObject.text}
                                onChange={(e) => {
                                    selectedObject.set('text', e.target.value);
                                    canvas.requestRenderAll();
                                    saveHistory();
                                }}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label>Color</label>
                            <input
                                type="color"
                                value={selectedObject.fill}
                                onChange={(e) => {
                                    selectedObject.set('fill', e.target.value);
                                    canvas.requestRenderAll();
                                    saveHistory();
                                }}
                                style={{ width: '100%', height: '40px' }}
                            />
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label>Font Size</label>
                            <input
                                type="number"
                                value={selectedObject.fontSize}
                                onChange={(e) => {
                                    selectedObject.set('fontSize', parseInt(e.target.value));
                                    canvas.requestRenderAll();
                                    saveHistory();
                                }}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label>Font Family</label>
                            <select
                                value={selectedObject.fontFamily}
                                onChange={(e) => {
                                    selectedObject.set('fontFamily', e.target.value);
                                    canvas.requestRenderAll();
                                    saveHistory();
                                }}
                                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#334155', color: 'white', border: '1px solid #475569' }}
                            >
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Courier New">Courier New</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Trebuchet MS">Trebuchet MS</option>
                                <option value="Impact">Impact</option>
                            </select>
                        </div>
                    </div>
                )}

                <button className="btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={handleSave}>
                    Save Template
                </button>
            </div>

            <div className="canvas-container card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#334155' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default CanvasEditor;
