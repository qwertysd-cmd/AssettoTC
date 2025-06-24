import React, { useState } from 'react';
import axios from 'axios';

function Parser() {
  const [file, setFile] = useState(null);
  const [driver, setDriver] = useState('');
  const [telemetryData, setTelemetryData] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDriverChange = (e) => {
    setDriver(e.target.value);
  };

  const handleParseReplay = async () => {
    if (!file || !driver) {
      alert('Please upload a file and select a driver');
      return;
    }

    const formData = new FormData();
    formData.append('replayFile', file);
    formData.append('driver', driver);

    try {
      const response = await axios.post('/api/parse-replay', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTelemetryData(response.data);
    } catch (error) {
      console.error('Error parsing replay:', error);
      alert('Failed to parse replay. Please try again.');
    }
  };

  return (
    <div className="parser">
      <h1>Parse Replay</h1>
      
      <div className="file-upload">
        <input type="file" accept=".acreplay" onChange={handleFileChange} />
      </div>
      
      <div className="driver-select">
        <label htmlFor="driver">Select Driver:</label>
        <select id="driver" value={driver} onChange={handleDriverChange}>
          <option value="">--Choose a driver--</option>
          {/* Driver options will be populated here */}
        </select>
      </div>
      
      <button onClick={handleParseReplay}>Parse Replay</button>
      
      <div className="parser-instructions">
        <h2>How to use the Replay Parser</h2>
        <ol>
          <li>Upload an Assetto Corsa replay file (.acreplay)</li>
          <li>Select the driver whose data you want to extract</li>
          <li>Click "Parse Replay" to process the file</li>
          <li>Download the resulting JSON telemetry data</li>
          <li>Use the telemetry JSON in the Analyzer tool</li>
        </ol>
      </div>
      
      {telemetryData && (
        <div className="telemetry-data">
          <h2>Telemetry Data</h2>
          <pre>{JSON.stringify(telemetryData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Parser;