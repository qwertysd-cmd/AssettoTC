import React, { useEffect, useRef, useState, useCallback } from 'react';

function TelemetryViewer({ track, lapData, isPlaying }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const imgLoadedRef = useRef(false);
  const requestRef = useRef(null);
  
  // Initialize transform state from track data or use defaults
  const [viewState, setViewState] = useState({
    offsetX: track?.transform?.x || 0,
    offsetY: track?.transform?.y || 0,
    scale: track?.transform?.scale || 1,
    rotation: track?.transform?.rotation || 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
  });

  // Memoized draw function to prevent recreation on every render
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Store canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas completely
    ctx.clearRect(0, 0, width, height);
    
    // Apply transformations in correct order
    ctx.save();
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.scale(viewState.scale, viewState.scale);
    ctx.rotate(viewState.rotation);
    
    // Draw the track image if loaded
    if (imgRef.current && imgLoadedRef.current) {
      ctx.drawImage(imgRef.current, 0, 0);
    }
    
    // Draw lap data
    if (lapData && lapData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2 / viewState.scale; // Scale line width inversely
      
      lapData.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    }
    
    ctx.restore();
  }, [viewState, lapData]);

  // Load track image when available
  useEffect(() => {
    if (track?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = track.imageUrl;
      
      // Set loaded flag on image load
      img.onload = () => {
        imgRef.current = img;
        imgLoadedRef.current = true;
        draw(); // Draw immediately once image loads
      };
      
      img.onerror = (e) => {
        console.error("Failed to load track image:", e);
        imgLoadedRef.current = false;
      };
    }
    
    // Update view state when track changes
    if (track?.transform) {
      setViewState(prev => ({
        ...prev,
        offsetX: track.transform.x || prev.offsetX,
        offsetY: track.transform.y || prev.offsetY,
        scale: track.transform.scale || prev.scale,
        rotation: track.transform.rotation || prev.rotation
      }));
    }
  }, [track, draw]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Transform to get coordinates before zoom
    const worldX = (mouseX - viewState.offsetX) / viewState.scale;
    const worldY = (mouseY - viewState.offsetY) / viewState.scale;
    
    // Calculate zoom factor
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(10, viewState.scale * zoomFactor));
    
    // Calculate new offsets to zoom into mouse position
    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;
    
    setViewState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    }));
  }, [viewState]);
  
  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setViewState(prev => ({
      ...prev,
      isDragging: true,
      dragStartX: event.clientX - rect.left - prev.offsetX,
      dragStartY: event.clientY - rect.top - prev.offsetY
    }));
  }, []);
  
  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event) => {
    if (!viewState.isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const newOffsetX = event.clientX - rect.left - viewState.dragStartX;
    const newOffsetY = event.clientY - rect.top - viewState.dragStartY;
    
    setViewState(prev => ({
      ...prev,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  }, [viewState.isDragging, viewState.dragStartX, viewState.dragStartY]);
  
  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);
  
  // Set up animation loop
  useEffect(() => {
    // Request animation frame if playing OR if we're actively interacting
    const renderLoop = () => {
      draw();
      requestRef.current = requestAnimationFrame(renderLoop);
    };
    
    // Start animation loop - always keep it running to fix disappearing on pause
    requestRef.current = requestAnimationFrame(renderLoop);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [draw, isPlaying]);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Cleanup function
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Force redraw when viewState changes
  useEffect(() => {
    draw();
  }, [draw, viewState]);

  // Fix canvas size to match container on resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const canvas = canvasRef.current;
        if (!canvas) continue;
        
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        // Scale context to account for device pixel ratio
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        // Redraw with new dimensions
        draw();
      }
    });
    
    const container = canvasRef.current?.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => resizeObserver.disconnect();
  }, [draw]);

  return (
    <div className="telemetry-canvas-container" style={{ width: '100%', height: '100%' }}>
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

export default TelemetryViewer;
