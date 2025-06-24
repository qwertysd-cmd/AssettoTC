import React, { useEffect, useRef, useState, useCallback } from 'react';

function MapViewer({ track, lapData }) {
  // Canvas and context refs
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);
  const imageLoadedRef = useRef(false);
  
  // Animation frame reference
  const rafRef = useRef(null);
  
  // View state
  const [viewState, setViewState] = useState({
    x: 0,
    y: 0,
    scale: 1,
    isDragging: false,
  });
  
  // Mouse interaction state
  const mousePos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  
  // Initialize the canvas and load image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get and store the context
    ctxRef.current = canvas.getContext('2d');
    
    // Set initial transform from track data
    if (track && track.transform) {
      setViewState({
        x: track.transform.x || 0,
        y: track.transform.y || 0,
        scale: track.transform.scale || 1,
        isDragging: false
      });
    }
    
    // Load the track image
    if (track && track.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = track.imageUrl;
      
      img.onload = () => {
        imageRef.current = img;
        imageLoadedRef.current = true;
        renderCanvas();
      };
    }
    
    // Set up proper canvas size handling
    setupCanvasSize(canvas);
    
    // Set up rendering loop
    startRenderLoop();
    
    return () => {
      stopRenderLoop();
    };
  }, [track]);
  
  // Canvas size setup
  const setupCanvasSize = useCallback((canvas) => {
    if (!canvas) return;
    
    // Set canvas size based on container
    const updateSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Apply DPI scaling to context
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.scale(dpr, dpr);
        renderCanvas();
      }
    };
    
    // Set initial size
    updateSize();
    
    // Add resize observer for responsive sizing
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas.parentElement);
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Render function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Get canvas dimensions in CSS pixels
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Save context state
    ctx.save();
    
    // Apply view transformations
    ctx.translate(viewState.x, viewState.y);
    ctx.scale(viewState.scale, viewState.scale);
    
    // Apply rotation if available
    if (track && track.transform && track.transform.rotation) {
      ctx.rotate(track.transform.rotation);
    }
    
    // Draw the track image if loaded
    if (imageRef.current && imageLoadedRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }
    
    // Draw lap data if available
    if (lapData && lapData.length) {
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2 / viewState.scale;
      
      lapData.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    }
    
    // Restore context
    ctx.restore();
  }, [track, lapData, viewState]);
  
  // Start continuous rendering loop
  const startRenderLoop = useCallback(() => {
    // Ensure we stop any existing loop first
    stopRenderLoop();
    
    // Create a new loop
    const loop = () => {
      renderCanvas();
      rafRef.current = requestAnimationFrame(loop);
    };
    
    // Start the loop
    rafRef.current = requestAnimationFrame(loop);
  }, [renderCanvas]);
  
  // Stop rendering loop
  const stopRenderLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);
  
  // Zoom handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Get mouse position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Store world position before zoom
    const worldX = (x - viewState.x) / viewState.scale;
    const worldY = (y - viewState.y) / viewState.scale;
    
    // Calculate zoom direction and factor
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 0.1;
    const newScale = Math.max(0.1, viewState.scale * (1 + factor * direction));
    
    // Calculate new position to zoom at mouse pointer
    const newX = x - worldX * newScale;
    const newY = y - worldY * newScale;
    
    // Update view state
    setViewState(prev => ({
      ...prev,
      x: newX,
      y: newY,
      scale: newScale
    }));
  }, [viewState]);
  
  // Mouse down handler for dragging
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Store drag start positions
    mousePos.current = { x, y };
    dragStart.current = { x: viewState.x, y: viewState.y };
    
    // Update drag state
    setViewState(prev => ({
      ...prev,
      isDragging: true
    }));
  }, [viewState]);
  
  // Mouse move handler for dragging
  const handleMouseMove = useCallback((e) => {
    if (!viewState.isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate drag distance
    const dx = x - mousePos.current.x;
    const dy = y - mousePos.current.y;
    
    // Update view position based on drag
    setViewState(prev => ({
      ...prev,
      x: dragStart.current.x + dx,
      y: dragStart.current.y + dy
    }));
  }, [viewState.isDragging]);
  
  // Mouse up handler for ending drag
  const handleMouseUp = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Add event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Clean up event listeners
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="map-container" style={{ width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: viewState.isDragging ? 'grabbing' : 'grab'
        }}
      />
    </div>
  );
}

export default MapViewer;
