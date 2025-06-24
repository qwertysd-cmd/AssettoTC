import React from 'react';

// Add React.memo
const CanvasViewer = React.memo(({ canvasContainerRef, canvasRef }) => {
    console.log("Rendering CanvasViewer"); // Add log to check re-renders
    return (
        <div className="canvas-container" ref={canvasContainerRef}>
            <canvas id="telemetryCanvas" ref={canvasRef}></canvas>
        </div>
    );
}); // Close React.memo

export default CanvasViewer;
