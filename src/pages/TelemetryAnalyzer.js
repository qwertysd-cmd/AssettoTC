import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../App.css'; // Adjust path if needed
import TrackSelection from '../components/TrackSelection'; // Updated import
import CarControls from '../components/CarControls';
import ViewControls from '../components/ViewControls';
import CanvasViewer from '../components/CanvasViewer';
import TelemetryDisplay from '../components/TelemetryDisplay';
import PlaybackControls from '../components/PlaybackControls';
import TelemetryGraph from '../components/TelemetryGraph';
import GraphControls from '../components/GraphControls';
import { normalizeTelemetryData } from '../utils/frameRateNormalizer';

// Base car dimensions
const CAR_WIDTH_BASE = 20;
const CAR_LENGTH_BASE = 40;
// Default interval if no data loaded (approx 66Hz)
const DEFAULT_FRAME_INTERVAL_MS = 1000 / 66;

const initialCarState = {
    id: 0,
    telemetryData: null,
    fileName: 'No file selected',
    points: [],
    color: '#007bff', // Initial color, will be updated
    carScale: 1,
    trailWidth: 2,
    trailLength: 200,
    transparency: 1,
    phaseShift: 0, // Kept for both, but will only be editable for user car
    trimStart: 0,
};

function TelemetryAnalyzer() {
    const [cars, setCars] = useState([]);
    const [globalFrame, setGlobalFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialOffsetRef = useRef({ x: 0, y: 0 });
    const [focusedCarId, setFocusedCarId] = useState(null);
    const [maxFrames, setMaxFrames] = useState(100);
    const [isRefCarVisible, setIsRefCarVisible] = useState(true);
    const [historyLength, setHistoryLength] = useState(500); // Changed from 50 to 500

    const [trackImage, setTrackImage] = useState(null);
    const [trackImageLoaded, setTrackImageLoaded] = useState(false);
    const [trackFileName, setTrackFileName] = useState('No track image selected');
    const [trackTransform, setTrackTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
    const [selectedTrackId, setSelectedTrackId] = useState('');
    const [availableTracks, setAvailableTracks] = useState([]);
    
    // Add state for car scale mode
    const [carScaleMode, setCarScaleMode] = useState('adaptive'); // 'adaptive' or 'actual'

    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const animationFrameId = useRef(null);
    const lastTimestampRef = useRef(0);
    const frameUpdateTimerRef = useRef(null);

    useEffect(() => {
        // Add timestamp to URL to prevent caching
        const timestamp = new Date().getTime();
        const trackDataUrl = `https://raw.githubusercontent.com/qwertysd-cmd/actrack/main/test.json?_=${timestamp}`;
        console.log("Fetching track data from:", trackDataUrl);
        
        fetch(trackDataUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch track list (Status: ${res.status})`);
                return res.json();
            })
            .then(data => {
                console.log("Track data fetched:", data);
                if (data) {
                    // Check if data is an array of tracks or a single track
                    if (Array.isArray(data)) {
                        // If it's already an array, use it directly
                        setAvailableTracks(data);
                    } else if (data.tracks && Array.isArray(data.tracks)) {
                        // If tracks are nested in a 'tracks' property
                        setAvailableTracks(data.tracks);
                    } else {
                        // If it's a single track, convert to array
                        setAvailableTracks([{
                            id: "track1",
                            name: data.displayName || "Track",
                            displayName: data.displayName || "Track",
                            transform: data.transform || { x: 0, y: 0, scale: 1, rotation: 0 },
                            imageUrl: data.imageUrl,
                            referenceLapUrl: data.referenceLapUrl
                        }]);
                    }
                } else {
                    setAvailableTracks([]);
                }
            })
            .catch(error => {
                console.error("Error fetching track data:", error);
                setAvailableTracks([]);
                alert(`Error fetching track list: ${error.message}`);
            });

    // Define the car objects with fixed colors that won't change
    const eduardoCar = { 
        ...initialCarState, 
        id: 0, 
        color: '#cc3333', // Eduardo is now consistently red
        fileName: "Eduardo (Reference)",
        trimStart: 0,
        phaseShift: 0,
        points: []
    };
    
    const userCar = { 
        ...initialCarState, 
        id: 1, 
        color: '#3366cc', // Player car is now consistently blue
        fileName: "No file selected (You)",
        trimStart: 0,
        phaseShift: 0,
        points: []
    };
    
    // Always initialize with two cars - Eduardo (reference) and You
    console.log("Initializing cars:", [eduardoCar, userCar]);
    setCars([eduardoCar, userCar]);
}, []);

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;
        if (canvas && container) {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                if (offset.x === 0 && offset.y === 0) {
                    setOffset({ x: canvas.width / 2, y: canvas.height / 2 });
                }
            }
        }
    }, [offset.x, offset.y]);

    useEffect(() => {
        const timer = setTimeout(resizeCanvas, 0);
        window.addEventListener('resize', resizeCanvas);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [resizeCanvas]);

    const carTimingDeps = JSON.stringify(cars.map(c => `${c.id}-${c.telemetryData?.numFrames}-${c.trimStart || 0}-${c.phaseShift || 0}`));
    useEffect(() => {
        // Get reference car (Eduardo, car id 0)
        const eduardoCar = cars.find(c => c.id === 0);
        let newMaxFrames = 1;
        
        // If Eduardo has telemetry data, use his frame count for the timeline
        if (eduardoCar?.telemetryData) {
            newMaxFrames = eduardoCar.telemetryData.numFrames;
        }
        
        setMaxFrames(newMaxFrames);

        if (globalFrame >= newMaxFrames && newMaxFrames > 0) {
            setGlobalFrame(0);
        } else if (newMaxFrames <= 1) {
            setGlobalFrame(0);
        }
    }, [carTimingDeps, cars, globalFrame]); // Added missing dependencies

    const loadTrackImage = useCallback((src) => {
        console.log("[loadTrackImage] Attempting to load:", src);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            console.log("[loadTrackImage] Success:", src);
            setTrackImage(img);
            setTrackImageLoaded(true);
        };
        img.onerror = (err) => {
            console.error("[loadTrackImage] Failed:", src, err);
            setTrackImage(null);
            setTrackImageLoaded(false);
            setTrackFileName('Failed to load track image');
            alert(`Error: Could not load track image. Check URL/CORS.`);
        };
        img.src = src;
    }, [setTrackFileName]);

    const handleTrackSelectChange = useCallback(async (e) => {
        const trackName = e.target.value;
        console.log("[handleTrackSelectChange] Selected:", trackName);
        setSelectedTrackId(trackName);

        setTrackImage(null);
        setTrackImageLoaded(false);
        setTrackFileName('Loading...');
        setTrackTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
        
        // Define car objects with FIXED colors
        const eduardoCar = { 
            ...initialCarState, 
            id: 0, 
            color: '#cc3333', // Ensure Eduardo is ALWAYS red (not grey)
            fileName: "Eduardo (Reference)"
        };
        
        const userCar = { 
            ...initialCarState, 
            id: 1, 
            color: '#3366cc', // Player car is always blue
            fileName: "No file selected (You)"
        };
        
        // Reset car data but maintain the color scheme
        setCars([eduardoCar, userCar]);
        
        setIsPlaying(false);
        setGlobalFrame(0);
        setIsRefCarVisible(true);

        if (!trackName) {
            console.log("[handleTrackSelectChange] No track selected, resetting.");
            setTrackFileName('No track selected');
            return;
        }

        try {
            // Find the selected track from available tracks - match by displayName
            const selectedTrack = availableTracks.find(track => track.displayName === trackName);
            
            if (!selectedTrack) {
                throw new Error(`Track "${trackName}" not found`);
            }
            
            console.log("[handleTrackSelectChange] Using selected track:", selectedTrack);
            
            // Update track transform and name from the selected track
            setTrackTransform(selectedTrack.transform || { x: 0, y: 0, scale: 1, rotation: 0 });
            setTrackFileName(selectedTrack.displayName);
            
            if (selectedTrack.imageUrl) {
                loadTrackImage(selectedTrack.imageUrl);
            } else {
                console.warn("[handleTrackSelectChange] No image URL in track config.");
                setTrackFileName('Track selected (no image)');
            }

            let refCarPromise = Promise.resolve(null);
            if (selectedTrack.referenceLapUrl) {
                // Convert jsdelivr URL to raw GitHub URL if needed
                const referenceLapUrl = selectedTrack.referenceLapUrl.includes('cdn.jsdelivr.net/gh/') 
                    ? selectedTrack.referenceLapUrl
                        .replace('cdn.jsdelivr.net/gh/', 'raw.githubusercontent.com/')
                        .replace('@', '/') 
                    : selectedTrack.referenceLapUrl;
                
                // Add timestamp to prevent caching
                const timestamp = new Date().getTime();
                const refLapUrlWithTimestamp = `${referenceLapUrl}?_=${timestamp}`;
                console.log("[handleTrackSelectChange] Fetching reference lap:", refLapUrlWithTimestamp);
                
                refCarPromise = fetch(refLapUrlWithTimestamp)
                    .then(res => {
                        if (!res.ok) throw new Error(`Ref lap fetch failed! status: ${res.status}`);
                        return res.json();
                    })
                    .then(refLapData => {
                        console.log("[handleTrackSelectChange] Received reference lap data.");
                        if (refLapData?.x && refLapData?.z && refLapData?.rotY && refLapData?.numFrames) {
                            return {
                                ...initialCarState,
                                id: 0,
                                color: '#cc3333', // Keep Eduardo red (not grey)
                                telemetryData: refLapData,
                                fileName: "Eduardo (Reference)",
                                points: [],
                                trailLength: 500, phaseShift: 0, trimStart: 0, transparency: 0.7,
                            };
                        } else {
                            console.warn("[handleTrackSelectChange] Invalid reference lap JSON format.");
                            return null;
                        }
                    })
                    .catch(refLapError => {
                        console.error("[handleTrackSelectChange] Error fetching/parsing reference lap:", refLapError);
                        alert(`Error loading reference lap: ${refLapError.message}`);
                        return null;
                    });
            }

            const initialRefCar = await refCarPromise;
            console.log("[handleTrackSelectChange] Reference car data processed:", initialRefCar ? "Loaded" : "Not loaded/Error");

            setCars(prevCars => {
                const userCar = prevCars.find(c => c.id === 1) || userCar;
                
                // If we have both reference car data and user car data, ensure they're using same recording interval
                if (initialRefCar?.telemetryData && userCar?.telemetryData) {
                    const refInterval = initialRefCar.telemetryData.recordingInterval;
                    
                    // Normalize user car data if intervals don't match
                    if (userCar.telemetryData.recordingInterval !== refInterval) {
                        userCar.telemetryData = normalizeTelemetryData(userCar.telemetryData, refInterval);
                        console.log("[handleTrackSelectChange] Normalized user car telemetry to match reference recording interval");
                    }
                }
                
                const newCarsList = [];
                if (initialRefCar) {
                    newCarsList.push(initialRefCar);
                }
                newCarsList.push(userCar);
                console.log("[handleTrackSelectChange] Final cars state:", newCarsList.map(c => c.id));
                return newCarsList;
            });
        } catch (error) {
            console.error("[handleTrackSelectChange] Error:", error);
            alert(`Failed to load track ${trackName}: ${error.message}`);
            setTrackFileName('Error loading track');
        }
    }, [loadTrackImage, availableTracks]); // Make sure all dependencies are included

    const handleTrackTransformChange = (e) => {
        const { name, value } = e.target;
        setTrackTransform(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleCenterTrack = () => {
        if (canvasRef.current) {
            setTrackTransform({ x: 0, y: 0, scale: trackTransform.scale, rotation: trackTransform.rotation });
            setOffset({ x: canvasRef.current.width / 2, y: canvasRef.current.height / 2 });
        }
    };

    const resetCar = (carId) => {
        setCars(prevCars => prevCars.map(car => {
            if (car.id === carId) {
                return {
                    ...initialCarState,
                    id: carId,
                    color: car.color,
                    fileName: carId === 0 ? "Eduardo (Reference)" : "No file selected"
                };
            }
            return car;
        }));
    };

    const handleCarChange = (id, field, value) => {
        setCars(prevCars => prevCars.map(car =>
            car.id === id ? { ...car, [field]: value } : car
        ));
    };

    const handleCarNumberChange = (id, field, value) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            handleCarChange(id, field, numValue);
        } else if (value === '') {
            handleCarChange(id, field, (field === 'trailLength') ? 0 : 1);
        }
    };

    const handleFileChange = (id, e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log(`[handleFileChange] Attempting to load file for car ID: ${id}`, file.name);
        handleCarChange(id, 'fileName', file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                console.log(`[handleFileChange] Parsed JSON data for car ID: ${id}`, data);
                if (data && data.x && data.z && data.rotY && data.numFrames) {
                    setCars(prevCars => {
                        // Find the reference car (Eduardo) to get the reference interval
                        const eduardoCar = prevCars.find(car => car.id === 0);
                        const referenceInterval = eduardoCar?.telemetryData?.recordingInterval || data.recordingInterval;
                        
                        // Normalize the loaded telemetry data to match reference interval
                        const normalizedData = normalizeTelemetryData(data, referenceInterval);
                        
                        // Always maintain the car's current color
                        const currentCar = prevCars.find(c => c.id === id);
                        
                        const updatedCars = prevCars.map(car =>
                            car.id === id ? { 
                                ...car, 
                                telemetryData: normalizedData, 
                                points: [],
                                color: car.id === 0 ? '#cc3333' : '#3366cc' // Ensure colors are maintained
                            } : car
                        );
                        return updatedCars;
                    });
                } else {
                    throw new Error("Invalid JSON format - missing required fields (x, z, rotY, numFrames)");
                }
            } catch (error) {
                console.error(`[handleFileChange] Error parsing JSON for car ID ${id}:`, error);
                alert(`Error parsing JSON file for Car ${id + 1}: ${error.message}`);
                handleCarChange(id, 'fileName', 'Error loading file');
                handleCarChange(id, 'telemetryData', null);
            }
        };
        reader.readAsText(file);
    };

    const handleFocusChange = (id) => {
        setFocusedCarId(prevFocusedId => (prevFocusedId === id ? null : id));
    };

    const handleTrailLengthAdjust = (id, amount) => {
        setCars(prevCars => prevCars.map(car =>
            car.id === id ? { ...car, trailLength: Math.max(0, car.trailLength + amount) } : car
        ));
    };

    const handleZoomChange = (e) => {
        setZoom(parseFloat(e.target.value));
    };

    const handleResetView = () => {
        setZoom(1);
        if (canvasRef.current) {
            setOffset({ x: canvasRef.current.width / 2, y: canvasRef.current.height / 2 });
        }
        setFocusedCarId(null);
    };

    const handleSyncCars = useCallback(() => {
        const eduardoCar = cars.find(car => car.id === 0);
        const youCar = cars.find(car => car.id === 1);

        if (!eduardoCar?.telemetryData || !youCar?.telemetryData) {
            console.log("Cannot sync: Missing telemetry data for one or both cars");
            return;
        }

        console.log("Starting high-precision sync analysis...");

        const eduardoFrame = Math.min(
            Math.max(0, globalFrame),
            eduardoCar.telemetryData.numFrames - 1
        );

        const eduardoX = eduardoCar.telemetryData.x[eduardoFrame];
        const eduardoZ = eduardoCar.telemetryData.z[eduardoFrame];
        const youTotalFrames = youCar.telemetryData.numFrames;

        const distanceSquared = (x1, z1, x2, z2) =>
            (x1 - x2) ** 2 + (z1 - z2) ** 2;

        const getDistanceAtFrame = (frame) => {
            if (frame < 0 || frame >= youTotalFrames) return Infinity;
            return distanceSquared(
                eduardoX,
                eduardoZ,
                youCar.telemetryData.x[frame],
                youCar.telemetryData.z[frame]
            );
        };

        // STEP 1: Compute search bounds (±30% around progress, corrected)
        const SAMPLE_COUNT = 100;
        const eduardoProgress = eduardoFrame / (eduardoCar.telemetryData.numFrames - 1);

        let lowerPercent = eduardoProgress - 0.3;
        let upperPercent = eduardoProgress + 0.3;

        if (lowerPercent < 0) {
            upperPercent = Math.min(upperPercent + Math.abs(lowerPercent), 1);
            lowerPercent = 0;
        }
        if (upperPercent > 1) {
            lowerPercent = Math.max(0, lowerPercent - (upperPercent - 1));
            upperPercent = 1;
        }

        const lowerBoundFrame = Math.floor(lowerPercent * youTotalFrames);
        const upperBoundFrame = Math.min(Math.floor(upperPercent * youTotalFrames), youTotalFrames - 1);
        const searchRange = upperBoundFrame - lowerBoundFrame;
        const stepSize = Math.max(1, Math.floor(searchRange / SAMPLE_COUNT));

        const samples = [];
        for (let i = 0; i <= SAMPLE_COUNT; i++) {
            const frame = Math.min(lowerBoundFrame + i * stepSize, upperBoundFrame);
            const distance = getDistanceAtFrame(frame);
            samples.push({ frame, distance });
        }

        // STEP 2: Find candidate local minima (simple flat/strict comparison)
        const localMinima = [];

        for (let i = 1; i < samples.length - 1; i++) {
            const prev = samples[i - 1];
            const curr = samples[i];
            const next = samples[i + 1];

            const isMin = curr.distance <= prev.distance && curr.distance <= next.distance;
            if (isMin) {
                localMinima.push(curr);
            }
        }

        if (localMinima.length === 0) {
            console.log("No local minima found. Sync failed.");
            return;
        }

        console.log(`Found ${localMinima.length} candidate minima in bounded sample`);

        // STEP 3: Ternary search refinement (no linear fallback)
        const refinedMinima = [];

        for (const candidate of localMinima) {
            const radius = stepSize * 2;
            let left = Math.max(0, candidate.frame - radius);
            let right = Math.min(youTotalFrames - 1, candidate.frame + radius);

            while (right - left > 2) {
                const mid1 = left + Math.floor((right - left) / 3);
                const mid2 = right - Math.floor((right - left) / 3);

                const d1 = getDistanceAtFrame(mid1);
                const d2 = getDistanceAtFrame(mid2);

                if (d1 < d2) {
                    right = mid2;
                } else {
                    left = mid1;
                }
            }

            const mid = Math.floor((left + right) / 2);
            refinedMinima.push({
                frame: mid,
                distance: getDistanceAtFrame(mid)
            });
        }

        // STEP 4: Select global best
        const globalMinimum = refinedMinima.reduce((best, curr) =>
            curr.distance < best.distance ? curr : best
        );

        const phaseShift = eduardoFrame - globalMinimum.frame;
        const negatedPhaseShift = -phaseShift;

        console.log(`Best match at frame ${globalMinimum.frame}, distance ${Math.sqrt(globalMinimum.distance).toFixed(2)}`);
        console.log(`Applying phase shift: ${negatedPhaseShift}`);

        setCars(prevCars =>
            prevCars.map(car =>
                car.id === 1 ? { ...car, phaseShift: negatedPhaseShift } : car
            )
        );
    }, [cars, globalFrame]);


    const canSync = useMemo(() => {
        const eduardoCar = cars.find(car => car.id === 0);
        const youCar = cars.find(car => car.id === 1);
        return Boolean(eduardoCar?.telemetryData && youCar?.telemetryData);
    }, [cars]);

    const handlePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const handleFrameChange = (e) => {
        setGlobalFrame(parseInt(e.target.value, 10));
        setIsPlaying(false);
    };

    const toggleRefCarVisibility = useCallback(() => {
        setIsRefCarVisible(prev => !prev);
    }, []);

    const drawCar = useCallback((ctx, car, x, y, rotation) => {
        const carWidth = CAR_WIDTH_BASE * car.carScale;
        const carLength = CAR_LENGTH_BASE * car.carScale;

        ctx.save();
        ctx.translate(x, -y);
        ctx.rotate(-rotation);

        ctx.fillStyle = car.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1 / zoom;
        ctx.fillRect(-carWidth / 2, -carLength / 2, carWidth, carLength);
        ctx.strokeRect(-carWidth / 2, -carLength / 2, carWidth, carLength);

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-carWidth / 4, -carLength / 2, carWidth / 2, 5 * car.carScale / zoom);

        ctx.restore();
    }, [zoom]);

    const drawPath = useCallback((ctx, car) => {
        if (!car || car.points.length < 2) return;

        ctx.lineWidth = car.trailWidth / zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let currentPathColor = null;
        ctx.beginPath();

        for (let i = 0; i < car.points.length; i++) {
            const point = car.points[i];
            const pathColor = point.color || '#888';

            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                if (pathColor !== currentPathColor && i > 0) {
                    ctx.strokeStyle = currentPathColor;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(car.points[i - 1].x, -car.points[i - 1].y);
                }

                if (i === 0 || pathColor !== currentPathColor) {
                    ctx.moveTo(point.x, -point.y);
                } else {
                    ctx.lineTo(point.x, -point.y);
                }
                currentPathColor = pathColor;
            }
        }

        if (currentPathColor) {
            ctx.strokeStyle = currentPathColor;
            ctx.stroke();
        }
    }, [zoom]);

    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        let viewCenterX = offset.x;
        let viewCenterY = offset.y;

        const carsToDraw = cars.filter(car => (car.id === 0 ? isRefCarVisible : true));

        if (focusedCarId !== null) {
            const focusedCar = cars.find(c => c.id === focusedCarId);
            if (focusedCar?.telemetryData) {
                const frameIndex = globalFrame + (focusedCar.phaseShift || 0) - (focusedCar.trimStart || 0);
                const carFrame = Math.min(
                    Math.max(0, frameIndex),
                    focusedCar.telemetryData.numFrames - 1
                );
                if (carFrame >= 0 && carFrame < focusedCar.telemetryData.numFrames) {
                    const carX = focusedCar.telemetryData.x[carFrame];
                    const carZ = focusedCar.telemetryData.z[carFrame];

                    const targetScreenX = canvas.width / 2;
                    const targetScreenY = canvas.height / 2;

                    viewCenterX = targetScreenX - carX * zoom;
                    viewCenterY = targetScreenY - -carZ * zoom;
                }
            }
        }

        ctx.translate(viewCenterX, viewCenterY);
        ctx.scale(zoom, zoom);

        if (trackImageLoaded && trackImage) {
            ctx.save();
            ctx.translate(trackTransform.x, -trackTransform.y);
            ctx.rotate(-trackTransform.rotation);
            ctx.scale(trackTransform.scale, trackTransform.scale);

            const trackDrawWidth = trackImage.width;
            const trackDrawHeight = trackImage.height;
            ctx.drawImage(
                trackImage,
                -trackDrawWidth / 2,
                -trackDrawHeight / 2,
                trackDrawWidth,
                trackDrawHeight
            );

            ctx.restore();
        }

        carsToDraw.forEach(car => {
            if (car.telemetryData) {
                const frameIndex = globalFrame + (car.phaseShift || 0) - (car.trimStart || 0);
                const carFrame = Math.min(
                    Math.max(0, frameIndex),
                    car.telemetryData.numFrames - 1
                );

                if (carFrame >= 0 && carFrame < car.telemetryData.numFrames) {
                    const x = car.telemetryData.x[carFrame];
                    const z = car.telemetryData.z[carFrame];
                    const rotation = car.telemetryData.rotY[carFrame];

                    // Set global alpha for transparency
                    ctx.globalAlpha = car.transparency ?? 1;
                    
                    drawPath(ctx, car);
                    drawCar(ctx, car, x, z, rotation);
                    
                    // Reset alpha
                    ctx.globalAlpha = 1;
                }
            }
        });

        ctx.restore();
    }, [cars, globalFrame, zoom, offset, trackImage, trackImageLoaded, trackTransform, drawCar, drawPath, focusedCarId, isRefCarVisible]);

    useEffect(() => {
        let animationRunning = true;

        const renderLoop = () => {
            if (!animationRunning) return;
            drawFrame();
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };

        animationFrameId.current = requestAnimationFrame(renderLoop);

        return () => {
            animationRunning = false;
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [drawFrame]);

    // Self-adjusting interval timer with simplified focus on maintaining consistent intervals
    function createAdjustingInterval(workFunc, interval, errorFunc) {
      let expected;
      let timeout;
      let frameTimestamps = [];
      const MAX_SAMPLES = 25; // Reduced sample size for faster adaptation
      let speedAdjustment = 1.0;
      
      const start = function() {
        // Clear any existing timer to prevent duplication
        if (timeout) clearTimeout(timeout);
        
        expected = Date.now();
        frameTimestamps = [expected]; // Initialize with start time
        timeout = setTimeout(step, interval);
        console.log(`Timer started with ${interval}ms interval`);
        return timeout;
      };
      
      const stop = function() {
        if (timeout) clearTimeout(timeout);
        timeout = null;
      };
      
      function step() {
        const now = Date.now();
        
        // Record timestamps for interval tracking
        frameTimestamps.push(now);
        if (frameTimestamps.length > MAX_SAMPLES) {
          frameTimestamps.shift();
        }
        
        // Calculate average frame time from recorded timestamps
        if (frameTimestamps.length > 1) {
          const totalElapsed = frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0];
          const avgFrameTime = totalElapsed / (frameTimestamps.length - 1);
          
          // Calculate ratio to target interval and adjust speed factor
          // If avgFrameTime > interval, we're too slow -> increase speedAdjustment
          // If avgFrameTime < interval, we're too fast -> decrease speedAdjustment
          if (avgFrameTime !== interval) {
            // Smoothly adjust speed factor proportionally to the ratio of actual vs target interval
            const targetRatio = interval / avgFrameTime;
            
            // Small step adjustment for stability (only adjust 15% of the difference)
            speedAdjustment = speedAdjustment * 0.85 + targetRatio * 0.15;
            
            // Clamp to reasonable bounds
            speedAdjustment = Math.min(Math.max(speedAdjustment, 0.5), 2.0);
            
            // Log significant adjustments
            if (frameTimestamps.length >= MAX_SAMPLES && Math.abs(1 - targetRatio) > 0.1) {
              console.log(`Adjusting speed: ${speedAdjustment.toFixed(2)}x (avg=${avgFrameTime.toFixed(1)}ms, target=${interval}ms)`);
            }
          }
        }
        
        // Execute the work function - check if we should stop first
        if (timeout) {
          workFunc();
        } else {
          return; // Timer was stopped externally
        }
        
        // Calculate next interval with drift correction
        const drift = now - expected;
        expected += interval;
        
        // Apply speed adjustment to the interval
        // Use a base value slightly less than interval to maintain target framerate
        // This counteracts the fact that setTimeout tends to run a bit late
        const baseInterval = interval * 0.99;
        
        // If we're ahead of schedule, wait longer; if behind, wait less
        const adjustedInterval = Math.max(0, Math.round(baseInterval - drift) / speedAdjustment);
        
        // Only schedule next step if we're still supposed to be running
        if (timeout) {
          timeout = setTimeout(step, adjustedInterval);
        }
      }
      
      return {
        start,
        stop,
        getStats: () => ({
          avgInterval: frameTimestamps.length > 1 ? 
            (frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0]) / (frameTimestamps.length - 1) : 
            interval,
          speedAdjustment,
          framesTracked: frameTimestamps.length - 1
        })
      };
    }

    // Fix the useEffect for playback to prevent restarting issues
    useEffect(() => {
      // Clear any existing timer before proceeding
      if (frameUpdateTimerRef.current) {
        frameUpdateTimerRef.current.stop();
        frameUpdateTimerRef.current = null;
      }
      
      // Only start if we're actually playing
      if (!isPlaying) {
        return;
      }

      // Get the recording interval from the reference car
      const eduardoCar = cars.find(car => car.id === 0);
      const recordingInterval = eduardoCar?.telemetryData?.recordingInterval || DEFAULT_FRAME_INTERVAL_MS;
      
      // Store current frame as a ref to avoid dependency issues
      const frameRef = { current: globalFrame };
      
      // Create a counter for logging progress
      let framesProcessed = 0;
      const startTime = Date.now();
      
      // Simple function to advance the frame
      const advanceFrame = () => {
        // Increment our local frame reference
        frameRef.current++;
        framesProcessed++;
        
        // Log stats every 250 frames
        if (framesProcessed % 250 === 0) {
          const elapsed = Date.now() - startTime;
          const targetElapsed = framesProcessed * recordingInterval;
          const percentRealTime = (targetElapsed / elapsed * 100).toFixed(1);
          
          console.log(`Progress: ${frameRef.current}/${maxFrames} (${Math.floor(frameRef.current/maxFrames*100)}%)`);
          console.log(`Playback speed: ${percentRealTime}% of real time`);
          
          // Log timer stats if available
          if (frameUpdateTimerRef.current?.getStats) {
            const stats = frameUpdateTimerRef.current.getStats();
            console.log(`Timing: ${stats.avgInterval.toFixed(1)}ms avg (${stats.speedAdjustment.toFixed(2)}x adjustment)`);
          }
        }
        
        // Check if we've reached the end
        if (frameRef.current >= maxFrames) {
          if (frameUpdateTimerRef.current) {
            frameUpdateTimerRef.current.stop();
            frameUpdateTimerRef.current = null;
          }
          setIsPlaying(false);
          setGlobalFrame(maxFrames - 1);
          return;
        }
        
        // Update the global frame state
        setGlobalFrame(frameRef.current);
      };
      
      // Create and start the timer
      console.log(`Starting playback at ${(1000/recordingInterval).toFixed(1)} fps (${recordingInterval.toFixed(1)}ms interval)`);
      
      const timer = createAdjustingInterval(advanceFrame, recordingInterval);
      frameUpdateTimerRef.current = timer;
      timer.start();
      
      // Cleanup on unmount or dependency change
      return () => {
        if (frameUpdateTimerRef.current) {
          frameUpdateTimerRef.current.stop();
          frameUpdateTimerRef.current = null;
        }
      };
    }, [isPlaying, maxFrames]); // Only depend on isPlaying and maxFrames, NOT globalFrame

    const carPointDeps = JSON.stringify(cars.map(c => `${c.id}-${c.telemetryData?.numFrames}-${c.trailLength}-${c.phaseShift || 0}-${c.trimStart || 0}`));
    useEffect(() => {
        setCars(prevCars => prevCars.map(car => {
            if (!car.telemetryData || car.trailLength <= 0) {
                return car.points && car.points.length === 0 ? car : { ...car, points: [] };
            }

            const points = [];
            const endFrameRelative = globalFrame + (car.phaseShift || 0) - (car.trimStart || 0);
            const startFrameRelative = Math.max(0, endFrameRelative - car.trailLength + 1);

            for (let f = startFrameRelative; f <= endFrameRelative; f++) {
                const carFrame = Math.min(
                    Math.max(0, f),
                    car.telemetryData.numFrames - 1
                );

                if (carFrame >= 0 && carFrame < car.telemetryData.numFrames) {
                    const x = car.telemetryData.x[carFrame];
                    const z = car.telemetryData.z[carFrame];
                    const throttle = car.telemetryData.throttle ? car.telemetryData.throttle[carFrame] : 0;
                    const brake = car.telemetryData.brake ? car.telemetryData.brake[carFrame] : 0;

                    let pathColor = '#888';
                    if (throttle > 0) pathColor = '#28a745';
                    if (brake > 0) pathColor = '#dc3545';
                    points.push({ x, y: z, color: pathColor });
                }
            }

            if (!car.points || JSON.stringify(car.points) !== JSON.stringify(points)) {
                return { ...car, points };
            }
            return car;
        }));
    }, [globalFrame, carPointDeps]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e) => {
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            let currentViewCenterX = offset.x;
            let currentViewCenterY = offset.y;
            if (focusedCarId !== null) {
                const focusedCar = cars.find(c => c.id === focusedCarId);
                if (focusedCar?.telemetryData) {
                    const frameIndex = globalFrame + focusedCar.phaseShift - focusedCar.trimStart;
                    const carFrame = Math.min(Math.max(0, frameIndex), focusedCar.telemetryData.numFrames - 1);
                    if (carFrame >= 0 && carFrame < focusedCar.telemetryData.numFrames) {
                        const carX = focusedCar.telemetryData.x[carFrame];
                        const carZ = focusedCar.telemetryData.z[carFrame];
                        currentViewCenterX = canvas.width / 2 - carX * zoom;
                        currentViewCenterY = canvas.height / 2 - (-carZ * zoom);
                    }
                }
            }

            const worldX = (mouseX - currentViewCenterX) / zoom;
            const worldY = (mouseY - currentViewCenterY) / zoom;

            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));

            setZoom(newZoom);

            if (focusedCarId === null) {
                const newOffsetX = mouseX - worldX * newZoom;
                const newOffsetY = mouseY - worldY * newZoom;
                setOffset({ x: newOffsetX, y: newOffsetY });
            }
        };

        const handleMouseDown = (e) => {
            if (focusedCarId !== null) return;

            const rect = canvas.getBoundingClientRect();
            dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            initialOffsetRef.current = { ...offset };
            setIsDragging(true);
            canvas.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e) => {
            if (!isDragging || focusedCarId !== null) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const dx = mouseX - dragStartRef.current.x;
            const dy = mouseY - dragStartRef.current.y;
            setOffset({
                x: initialOffsetRef.current.x + dx,
                y: initialOffsetRef.current.y + dy
            });
        };

        const handleMouseUpOrLeave = () => {
            if (isDragging) {
                setIsDragging(false);
                canvas.style.cursor = 'default';
            }
        };

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUpOrLeave);
        canvas.addEventListener('mouseleave', handleMouseUpOrLeave);

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUpOrLeave);
            canvas.removeEventListener('mouseleave', handleMouseUpOrLeave);
            if (canvas) {
                canvas.style.cursor = 'default';
            }
        };
    }, [zoom, offset, isDragging, focusedCarId, cars, globalFrame]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                handlePlayPause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handlePlayPause]);

    const visibleCarsForTelemetry = cars.filter(car => {
        const isVisible = (car.id === 0) ? isRefCarVisible : true;
        return isVisible;
    });

    // Add function to toggle car scale mode
    const handleCarScaleModeToggle = useCallback(() => {
        setCarScaleMode(prev => prev === 'adaptive' ? 'actual' : 'adaptive');
    }, []);
    
    // Function to calculate car scale based on mode and zoom
    const calculateCarScale = useCallback((zoomLevel) => {
        if (carScaleMode === 'actual') {
            // Fixed scale for actual mode
            return 0.12;
        } else {
            // Adaptive scale based on zoom level
            if (zoomLevel >= 6) {
                return 0.12; // Smallest size at high zoom
            } else if (zoomLevel <= 1) {
                return 0.8; // Largest size at low zoom
            } else {
                // Define discrete steps between zoom 1 and 6
                const steps = [
                    { zoom: 1, scale: 0.8 },
                    { zoom: 2, scale: 0.6 },
                    { zoom: 3.5, scale: 0.4 },
                    { zoom: 5, scale: 0.25 },
                    { zoom: 6, scale: 0.12 }
                ];
                
                // Find the closest step below and above current zoom
                let lowerStep = steps[0];
                let upperStep = steps[steps.length - 1];
                
                for (let i = 0; i < steps.length; i++) {
                    if (steps[i].zoom <= zoomLevel) {
                        lowerStep = steps[i];
                    }
                    if (steps[i].zoom >= zoomLevel && upperStep.zoom > steps[i].zoom) {
                        upperStep = steps[i];
                    }
                }
                
                // If they're the same, use that scale
                if (lowerStep === upperStep) return lowerStep.scale;
                
                // Otherwise do a simple linear interpolation between the two steps
                const zoomRange = upperStep.zoom - lowerStep.zoom;
                const scaleRange = upperStep.scale - lowerStep.scale;
                const zoomRatio = (zoomLevel - lowerStep.zoom) / zoomRange;
                
                return lowerStep.scale + scaleRange * zoomRatio;
            }
        }
    }, [carScaleMode]);
    
    // Apply car scale when zoom or mode changes
    useEffect(() => {
        const newCarScale = calculateCarScale(zoom);
        setCars(prevCars => prevCars.map(car => ({
            ...car,
            carScale: newCarScale
        })));
    }, [zoom, carScaleMode, calculateCarScale]);

    return (
        <div className="telemetry-analyzer-page">
            <h1>Telemetry Analyzer</h1>
            
            <TrackSelection
                availableTracks={availableTracks}
                selectedTrackId={selectedTrackId}
                handleTrackSelectChange={handleTrackSelectChange}
                trackFileName={trackFileName}
            />
            
            <CarControls
                cars={cars}
                focusedCarId={focusedCarId}
                handleFileChange={handleFileChange}
                handleCarNumberChange={handleCarNumberChange}
                handleCarChange={handleCarChange}
                handleTrailLengthAdjust={handleTrailLengthAdjust}
                handleFocusChange={handleFocusChange}
                resetCar={resetCar}
                isRefCarVisible={isRefCarVisible}
                toggleRefCarVisibility={toggleRefCarVisibility}
            />

            <ViewControls
                zoom={zoom}
                handleZoomChange={handleZoomChange}
                handleResetView={handleResetView}
                focusedCarId={focusedCarId}
                handleSyncCars={handleSyncCars}
                canSync={canSync && isRefCarVisible}
                trackTransform={trackTransform}
                handleTrackTransformChange={handleTrackTransformChange}
                carScaleMode={carScaleMode}
                handleCarScaleModeToggle={handleCarScaleModeToggle}
            />
            
            <div className="main-display-area">
                <CanvasViewer
                    canvasContainerRef={canvasContainerRef}
                    canvasRef={canvasRef}
                />
                <TelemetryDisplay
                    cars={visibleCarsForTelemetry}
                    globalFrame={globalFrame}
                />
                <PlaybackControls
                    isPlaying={isPlaying}
                    handlePlayPause={handlePlayPause}
                    globalFrame={globalFrame}
                    maxFrames={maxFrames}
                    handleFrameChange={handleFrameChange}
                />
            </div>

            {/* Add TelemetryGraph Component */}
            <TelemetryGraph 
                cars={visibleCarsForTelemetry}
                globalFrame={globalFrame}
                historyLength={historyLength}
            />

            {/* Add Graph Controls below the graphs */}
            <GraphControls 
                historyLength={historyLength}
                setHistoryLength={setHistoryLength}
            />

            <div className="info">
                <p>Instructions:</p>
                <ul>
                    <li>Select a track or upload your own track image. Adjust transform controls as needed.</li>
                    <li>Load JSON files exported from the Assetto Corsa replay parser for the two cars.</li>
                    <li>Use mouse wheel to zoom in/out (zooms towards cursor).</li>
                    <li>Click and drag to pan the view (disabled when a car is focused).</li>
                    <li>Use the 'Focus'/'Unfocus' button on a car to center it or release focus.</li>
                    <li>Press Spacebar to Play/Pause.</li>
                    <li>The car's path is traced: green for throttle, red for braking, grey otherwise.</li>
                    <li>Adjust trail length and transparency for each car.</li>
                    <li>Playback attempts to match replay recording interval.</li>
                    <li>The input graphs show throttle and brake history, adjustable with the history length control.</li>
                </ul>
            </div>
        </div>
    );
}

export default TelemetryAnalyzer;
