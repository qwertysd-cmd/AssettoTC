import React, { useState } from 'react';

// Add React.memo
const ViewControls = React.memo(({
    zoom,
    handleZoomChange,
    handleResetView,
    focusedCarId,
    handleFocusChange,
    handleSyncCars,
    canSync,
    // Add track configuration props
    trackTransform,
    handleTrackTransformChange,
    carScaleMode,
    handleCarScaleModeToggle,
    // Add props for transparency controls
    cars,
    handleCarChange,
    isRefCarVisible
}) => {
    console.log("Rendering ViewControls");

    // Add state for showing/hiding track config controls
    const [showConfigControls, setShowConfigControls] = useState(false);

    const toggleConfigControls = () => {
        setShowConfigControls(prev => !prev);
    };

    return (
        <div className="control-section">
            <h3>View Controls</h3>
            <div className="control-group">
                <div className="control-item">
                    <label htmlFor="zoomSlider">Zoom:</label>
                    <input type="range" id="zoomSlider" min="0.1" max="10" step="0.1" value={zoom} onChange={handleZoomChange} />
                    <span id="zoomValue">{zoom.toFixed(1)}x</span>
                </div>
                <button id="resetViewBtn" onClick={handleResetView}>Reset View</button>
                <button 
                    id="syncCarsBtn" 
                    onClick={handleSyncCars}
                    disabled={!canSync}
                    title={!canSync ? "Requires both Eduardo and You car data" : "Sync You car position with Eduardo"}
                >
                    Sync Cars
                </button>

                {/* Add track config button */}
                <button onClick={toggleConfigControls} className="config-toggle-btn">
                    {showConfigControls ? 'Hide Track Config' : 'Configure Track'}
                </button>

                {/* Car Scale Toggle */}
                <div className="control-item car-scale-toggle">
                    <span>Car Scale:</span>
                    <div 
                        className={`toggle-switch ${carScaleMode}`} 
                        onClick={handleCarScaleModeToggle}
                        title={carScaleMode === 'adaptive' ? 'Car size adapts to zoom level' : 'Car size matches real-world scale'}
                    >
                        <div className="toggle-option adaptive-option">Adaptive</div>
                        <div className="toggle-option actual-option">Actual</div>
                        <div className={`toggle-thumb ${carScaleMode}`}></div>
                    </div>
                </div>

                {/* Opacity Controls */}
                <div className="control-item">
                    <span>Opacity:</span>
                    <div className="control-item">
                        {cars.map(car => (
                            <div key={car.id} className="control-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '60px' }}>
                                    <small>{car.id === 0 ? 'Eduardo' : 'You'}</small>
                                    <small>({Math.round(car.transparency * 100)}%)</small>
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={Math.round(car.transparency * 100)}
                                        onChange={(e) => handleCarChange(car.id, 'transparency', parseFloat(e.target.value) / 100)}
                                    />
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleFocusChange(car.id)}
                                        className={focusedCarId === car.id ? 'focus-btn active' : 'focus-btn'}
                                        disabled={car.id === 0 && !isRefCarVisible}
                                    >
                                        {focusedCarId === car.id ? 'Unfocus' : 'Focus'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add track configuration controls */}
            {showConfigControls && (
                <div className="control-group track-config-controls">
                    <div className="control-item">
                        <label htmlFor="trackX">Track X:</label>
                        <input type="number" id="trackX" name="x" step="1" value={trackTransform.x} onChange={handleTrackTransformChange} />
                    </div>
                    <div className="control-item">
                        <label htmlFor="trackY">Track Y:</label>
                        <input type="number" id="trackY" name="y" step="1" value={trackTransform.y} onChange={handleTrackTransformChange} />
                    </div>
                    <div className="control-item">
                        <label htmlFor="trackScale">Track Scale:</label>
                        <input type="number" id="trackScale" name="scale" step="0.01" min="0.01" value={trackTransform.scale} onChange={handleTrackTransformChange} />
                    </div>
                    <div className="control-item">
                        <label htmlFor="trackRotation">Track Rotation:</label>
                        <input type="number" id="trackRotation" name="rotation" step="0.1" value={trackTransform.rotation} onChange={handleTrackTransformChange} />
                    </div>
                </div>
            )}
        </div>
    );
});

export default ViewControls;
