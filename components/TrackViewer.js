import React, { useRef, useEffect, useState } from 'react';

const TrackViewer = ({ trackData, telemetryData }) => {
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  });

  // Initialize the transform based on track data
  useEffect(() => {
    if (trackData && trackData.transform) {
      setViewport(prev => ({
        ...prev,
        scale: trackData.transform.scale || 0.8,
        translateX: trackData.transform.x || 0,
        translateY: trackData.transform.y || 0
      }));
    }
  }, [trackData]);

  // Handle zoom properly with mouse position as zoom origin
  const handleWheel = (e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert mouse position to world space before scaling
    const worldX = (mouseX - viewport.translateX) / viewport.scale;
    const worldY = (mouseY - viewport.translateY) / viewport.scale;
    
    // Calculate new scale with smooth zooming
    const zoomIntensity = 0.1;
    const scaleFactor = e.deltaY > 0 ? (1 - zoomIntensity) : (1 + zoomIntensity);
    const newScale = viewport.scale * scaleFactor;
    
    // Limit zoom range to prevent disappearing
    const minScale = 0.1;
    const maxScale = 10;
    
    if (newScale < minScale || newScale > maxScale) return;
    
    // Calculate new translations to zoom towards mouse position
    const newTranslateX = mouseX - worldX * newScale;
    const newTranslateY = mouseY - worldY * newScale;
    
    setViewport(prev => ({
      ...prev,
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY
    }));
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setViewport(prev => ({
      ...prev,
      isDragging: true,
      lastX: e.clientX - rect.left,
      lastY: e.clientY - rect.top
    }));
  };

  const handleMouseMove = (e) => {
    if (!viewport.isDragging) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = mouseX - viewport.lastX;
    const dy = mouseY - viewport.lastY;
    
    setViewport(prev => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
      lastX: mouseX,
      lastY: mouseY
    }));
  };

  const handleMouseUp = () => {
    setViewport(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Add event listeners for zoom and drag
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [viewport]);

  // Draw the track and telemetry data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getBoundingClientRect();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(viewport.translateX, viewport.translateY);
    ctx.scale(viewport.scale, viewport.scale);
    if (trackData && trackData.transform && trackData.transform.rotation) {
      ctx.rotate(trackData.transform.rotation);
    }
    
    // Draw track background if image is available
    if (trackData && trackData.imageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width / viewport.scale, canvas.height / viewport.scale);
        
        // Draw telemetry data if available
        if (telemetryData) {
          drawTelemetryData(ctx, telemetryData);
        }
      };
      img.src = trackData.imageUrl;
    } else if (telemetryData) {
      drawTelemetryData(ctx, telemetryData);
    }
    
    ctx.restore();
  }, [trackData, telemetryData, viewport]);

  // Helper function to draw telemetry data
  const drawTelemetryData = (ctx, data) => {
    // Implementation depends on your data format
    // This is a placeholder for actual telemetry rendering
    if (!data || !data.points) return;
    
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2 / viewport.scale; // Adjust line width for zoom
    
    data.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    ctx.stroke();
  };

  return (
    <div className="track-viewer-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default TrackViewer;
