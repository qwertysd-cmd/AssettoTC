import React, { useState } from 'react';

// The only URL that should be hardcoded
const MASTER_TRACK_LIST_URL = 'https://raw.githubusercontent.com/qwertysd-cmd/actrack/main/test.json';

function TrackControls({
    availableTracks,
    selectedTrackId,
    handleTrackSelectChange,
    trackFileName,
    trackTransform,
    handleTrackTransformChange,
    handleCenterTrack
}) {
    const [showConfigControls, setShowConfigControls] = useState(false);

    const toggleConfigControls = () => {
        setShowConfigControls(prev => !prev);
    };

    return (
        <div className="control-section">
            <h3>Track Controls</h3>
            <div className="track-selector">
                <select 
                    id="trackSelect" 
                    value={selectedTrackId} 
                    onChange={handleTrackSelectChange}
                >
                    {!selectedTrackId && <option value="">Select a track</option>}
                    {Array.isArray(availableTracks) && availableTracks.map((track, index) => (
                        <option key={track.displayName || index} value={track.displayName}>
                            {track.displayName}
                        </option>
                    ))}
                </select>
                <span className="file-name-display">{trackFileName}</span>
                
                <button onClick={toggleConfigControls} className="config-toggle-btn">
                    {showConfigControls ? 'Hide Track Config' : 'Configure Track'}
                </button>
            </div>
            
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
                    <button id="centerTrackBtn" onClick={handleCenterTrack}>Center View</button>
                </div>
            )}
        </div>
    );
}

export default TrackControls;
