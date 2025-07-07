import React, { useState, useEffect } from 'react';
import '../App.css'; // Adjust path if needed
import { parseReplayForDriver, getDriversFromReplay, downloadJson } from '../utils/replayParser';

function JsonGenerator() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [driverName, setDriverName] = useState('');
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setSelectedFile(file);
        setStatusMessage('');
        setError('');
        setAvailableDrivers([]);
        
        if (file && file.name.toLowerCase().endsWith('.acreplay')) {
            setIsLoadingDrivers(true);
            try {
                const drivers = await getDriversFromReplay(file);
                setAvailableDrivers(drivers);
                if (drivers.length > 0) {
                    setStatusMessage(`Found ${drivers.length} driver${drivers.length > 1 ? 's' : ''} in replay file.`);
                }
            } catch (err) {
                console.error('Error loading drivers:', err);
                setError(`Failed to extract driver names: ${err.message}`);
            } finally {
                setIsLoadingDrivers(false);
            }
        }
    };

    const handleDriverNameChange = (event) => {
        setDriverName(event.target.value);
    };

    const selectDriver = (driver) => {
        setDriverName(driver);
    };

    const handleGenerate = async () => {
        if (!selectedFile || !driverName) {
            setError('Please select a replay file and enter a driver name.');
            return;
        }

        setIsLoading(true);
        setError('');
        setStatusMessage('Processing replay file...');

        try {
            // Parse the replay file in the browser
            const jsonData = await parseReplayForDriver(selectedFile, driverName);
            
            // Download the generated JSON
            const filename = downloadJson(jsonData, driverName, selectedFile.name);
            
            setStatusMessage(`JSON file '${filename}' generated and downloaded!`);
        } catch (err) {
            console.error('Generation failed:', err);
            setError(`Generation failed: ${err.message}`);
            setStatusMessage('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="json-generator-page">
            <h2>Parse the replay file</h2>
            <p>Upload an Assetto Corsa replay file (.acreplay) and specify the driver's name to extract their telemetry data.</p>

            <div className="control-section">
                <div className="control-group">
                    <div className="control-item">
                        <label htmlFor="replayFileInput" className="file-input-label">Select Replay File (.acreplay)</label>
                        <input
                            type="file"
                            id="replayFileInput"
                            accept=".acreplay"
                            onChange={handleFileChange}
                        />
                        <span className="file-name-display">{selectedFile ? selectedFile.name : 'No file selected'}</span>
                    </div>
                    
                    <div className="control-item">
                        <label htmlFor="driverNameInput">Driver Name:</label>
                        <input
                            type="text"
                            id="driverNameInput"
                            value={driverName}
                            onChange={handleDriverNameChange}
                            placeholder="Enter exact driver name"
                        />
                    </div>
                    
                    {isLoadingDrivers && (
                        <div className="loading-drivers">
                            Loading drivers from replay file...
                        </div>
                    )}
                    
                    {availableDrivers.length > 0 && (
                        <div className="driver-list">
                            <label>Available drivers:</label>
                            <div className="driver-buttons">
                                {availableDrivers.map((driver, index) => (
                                    <button 
                                        key={index}
                                        type="button"
                                        className={`driver-button ${driver === driverName ? 'active' : ''}`}
                                        onClick={() => selectDriver(driver)}
                                    >
                                        {driver}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !selectedFile || !driverName}
                        className={isLoading ? 'loading' : ''}
                    >
                        {isLoading ? 'Generating...' : 'Generate & Download JSON'}
                    </button>
                </div>
                
                {statusMessage && <p className="status-message">{statusMessage}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
            
            <div className="info">
                <p>Notes:</p>
                <ul>
                    <li>Ensure that your replay is pre-trimmed and only includes the lap you want to compare. a little extra before and after is alright, just not too much</li>
                    <li>All processing happens locally in your browser - no data is sent to any server.</li>
                </ul>
            </div>
        </div>
    );
}

export default JsonGenerator;
