import React, { useEffect, useRef, useState } from 'react';

const TrackViewer = ({ trackData }) => {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    if (!trackData || !trackData.imageUrl) return;

    // Load the track background image
    const img = new Image();
    img.src = trackData.imageUrl;
    img.onload = () => {
      setBackgroundImage(img);
      setLoaded(true);
    };
  }, [trackData]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !backgroundImage || !trackData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations from the track config
    const { transform } = trackData;
    
    // Calculate the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Save the current state
    ctx.save();
    
    // Move to center, apply transforms, then move back
    ctx.translate(centerX, centerY);
    ctx.scale(transform.scale, transform.scale);
    ctx.rotate(transform.rotation);
    ctx.translate(transform.x, transform.y);
    
    // Draw the background image
    ctx.drawImage(
      backgroundImage, 
      -backgroundImage.width / 2, 
      -backgroundImage.height / 2, 
      backgroundImage.width, 
      backgroundImage.height
    );
    
    // If reference lap data exists, draw it
    if (trackData.referenceLapData) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2 / transform.scale;
      ctx.beginPath();
      
      const { x, z } = trackData.referenceLapData;
      for (let i = 0; i < x.length; i++) {
        const pointX = x[i];
        const pointZ = z[i];
        
        if (i === 0) {
          ctx.moveTo(pointX, pointZ);
        } else {
          ctx.lineTo(pointX, pointZ);
        }
      }
      
      ctx.stroke();
    }
    
    // Restore the saved state
    ctx.restore();
  }, [loaded, trackData, backgroundImage]);

  if (!trackData) {
    return <div className="no-track-selected">No track selected. Please use the "Select Track" button.</div>;
  }

  return (
    <div className="track-viewer">
      <h2>{trackData.displayName || 'Track Viewer'}</h2>
      <canvas 
        ref={canvasRef}
        width={800}
        height={600}
        className="track-canvas"
      />
    </div>
  );
};

export default TrackViewer;
