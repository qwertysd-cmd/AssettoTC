import React from 'react';

function TrackSelection({
    availableTracks,
    selectedTrackId,
    handleTrackSelectChange,
    trackFileName
}) {
    return (
        <div className="control-section">
            <h3>Track Selection</h3>
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
            </div>
        </div>
    );
}

export default TrackSelection;
