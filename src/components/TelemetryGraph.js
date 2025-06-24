import React, { useEffect, useRef } from 'react';

function TelemetryGraph({ cars, globalFrame, historyLength = 500 }) {
    const throttleCanvasRef = useRef(null);
    const brakeCanvasRef = useRef(null);
    
    useEffect(() => {
        const resizeCanvases = () => {
            const throttleCanvas = throttleCanvasRef.current;
            const brakeCanvas = brakeCanvasRef.current;
            
            if (!throttleCanvas || !brakeCanvas) return;
            
            // Get parent width to ensure proper alignment with other components
            const parentWidth = throttleCanvas.parentElement.parentElement.clientWidth;
            
            // Adjust for padding/margins
            const actualWidth = parentWidth - 30; // Account for padding
            
            throttleCanvas.width = actualWidth;
            brakeCanvas.width = actualWidth;
            throttleCanvas.height = 120;
            brakeCanvas.height = 120;
            
            // Force redraw after resize
            drawGraph(throttleCanvas, 'throttle');
            drawGraph(brakeCanvas, 'brake');
        };
        
        // Initial resize and setup resize observer
        resizeCanvases();
        const resizeObserver = new ResizeObserver(resizeCanvases);
        
        const throttleCanvas = throttleCanvasRef.current;
        if (throttleCanvas && throttleCanvas.parentElement) {
            resizeObserver.observe(throttleCanvas.parentElement.parentElement);
        }
        
        // Clean up
        return () => {
            resizeObserver.disconnect();
        };
    }, []);
    
    // Update the drawGraph function to use consistent colors
    const drawGraph = (canvas, dataType) => {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        // Use the non-antialiased version of the context
        ctx.imageSmoothingEnabled = false;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines (25%, 50%, 75%)
        for (let i = 1; i <= 3; i++) {
            const y = height * (i / 4);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Find reference car (Eduardo) and user car
        const eduardoCar = cars.find(car => car.id === 0);
        const youCar = cars.find(car => car.id === 1);
        
        // Only proceed if we have valid cars with telemetry data
        if ((!eduardoCar || !eduardoCar.telemetryData) && 
            (!youCar || !youCar.telemetryData)) {
            // Draw "No data" text if no cars have data
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No telemetry data', width / 2, height / 2);
            return;
        }

        // Define a FIXED line thickness
        const LINE_WIDTH = 3.0; // Slightly thinner but still visible
        
        // Draw data for both cars using rectangles for perfectly consistent thickness
        // Use fixed colors for Eduardo (red) and You (blue)
        [
            { car: eduardoCar, color: 'rgba(204, 51, 51, 0.8)' }, // Red for Eduardo
            { car: youCar, color: 'rgba(51, 102, 204, 0.8)' }     // Blue for You
        ].forEach(({ car, color }) => {
            if (!car?.telemetryData) return;
            
            const telemetry = car.telemetryData;
            if (!telemetry[dataType] || telemetry[dataType].length === 0) return;
            
            // Current frame for this car (accounting for phase shift and trim)
            const adjustedFrame = globalFrame + (car.phaseShift || 0) - (car.trimStart || 0);
            if (adjustedFrame < 0) return;
            
            // Calculate the range of frames to display
            const startFrame = Math.max(0, adjustedFrame - historyLength + 1);
            const endFrame = Math.min(telemetry.numFrames - 1, adjustedFrame);
            
            if (startFrame >= endFrame) return;
            
            // Set the fill color
            ctx.fillStyle = color;
            
            // Draw segments individually as simple rectangles for guaranteed constant thickness
            for (let i = startFrame; i < endFrame; i++) {
                const x1 = ((i - startFrame) / (endFrame - startFrame)) * width;
                const x2 = ((i + 1 - startFrame) / (endFrame - startFrame)) * width;
                
                // Get and normalize values
                let value1 = telemetry[dataType][i];
                let value2 = telemetry[dataType][i + 1];
                
                if (value1 > 0 && value1 <= 255) value1 /= 255;
                if (value2 > 0 && value2 <= 255) value2 /= 255;
                
                // Clamp values between 0 and 1
                value1 = Math.max(0, Math.min(1, value1));
                value2 = Math.max(0, Math.min(1, value2));
                
                // Calculate y positions
                const y1 = height - (value1 * height);
                const y2 = height - (value2 * height);
                
                // Calculate the angle of the line
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // Draw the line segment as a rotated rectangle with fixed height
                ctx.save();
                ctx.translate(x1, y1);
                ctx.rotate(angle);
                ctx.fillRect(0, -LINE_WIDTH/2, length, LINE_WIDTH);
                ctx.restore();
            }
            
            // Add a dot at the current position (end of graph)
            const lastValue = telemetry[dataType][endFrame];
            let normalizedValue = lastValue;
            if (normalizedValue > 0 && normalizedValue <= 255) normalizedValue /= 255;
            normalizedValue = Math.max(0, Math.min(1, normalizedValue));
            
            const dotX = width;
            const dotY = height - (normalizedValue * height);
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, LINE_WIDTH, 0, Math.PI * 2);
            ctx.fill();
        });
    };
    
    // Update graphs when relevant data changes
    useEffect(() => {
        if (throttleCanvasRef.current && brakeCanvasRef.current) {
            drawGraph(throttleCanvasRef.current, 'throttle');
            drawGraph(brakeCanvasRef.current, 'brake');
        }
    }, [cars, globalFrame, historyLength]);
    
    return (
        <div className="telemetry-graphs-container">
            <div className="telemetry-graphs">
                <div className="telemetry-graph-container">
                    <div className="graph-title">Throttle</div>
                    <canvas ref={throttleCanvasRef} className="telemetry-graph-canvas" />
                </div>
                <div className="telemetry-graph-container">
                    <div className="graph-title">Brake</div>
                    <canvas ref={brakeCanvasRef} className="telemetry-graph-canvas" />
                </div>
            </div>
        </div>
    );
}

export default React.memo(TelemetryGraph);
