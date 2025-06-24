import React from 'react';

// Add React.memo
const PlaybackControls = React.memo(({
    isPlaying,
    handlePlayPause,
    globalFrame,
    maxFrames,
    handleFrameChange
}) => {
    console.log("Rendering PlaybackControls with maxFrames:", maxFrames); // Add log to check value
    
    // Ensure maxFrames is at least 1 to avoid showing x/0
    const effectiveMaxFrames = Math.max(1, maxFrames);
    
    return (
        <div className="playing-controls">
            <button id="playPauseBtn" onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
            <input
                type="range"
                id="frameSlider"
                min="0"
                max={effectiveMaxFrames > 0 ? effectiveMaxFrames - 1 : 0} // Ensure max is not negative
                value={globalFrame}
                onChange={handleFrameChange}
                style={{ flexGrow: 1 }}
                disabled={effectiveMaxFrames <= 1} // Disable if no frames or only one frame
            />
            <span id="frameInfo">{globalFrame} / {effectiveMaxFrames > 0 ? effectiveMaxFrames - 1 : 0}</span>
        </div>
    );
}); // Close React.memo

export default PlaybackControls;
