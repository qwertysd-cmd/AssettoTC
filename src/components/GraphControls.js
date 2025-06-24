import React from 'react';

function GraphControls({ historyLength, setHistoryLength }) {
    return (
        <div className="control-section graph-controls">
            <h3>Graph Controls</h3>
            <div className="control-group">
                <div className="control-item">
                    <label htmlFor="historyLength">History Length (frames):</label>
                    <input 
                        type="number" 
                        id="historyLength" 
                        value={historyLength} 
                        onChange={(e) => setHistoryLength(Math.max(10, parseInt(e.target.value) || 500))}
                        min="10" 
                        step="100"
                    />
                </div>
                <div className="control-item small-text">
                    <span>Controls how many frames of history to show in the input graphs</span>
                </div>
            </div>
            
            <div className="graph-legend">
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#cc3333' }}></span>
                    <span className="legend-label">Eduardo</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#3366cc' }}></span>
                    <span className="legend-label">You</span>
                </div>
            </div>
        </div>
    );
}

export default React.memo(GraphControls);
