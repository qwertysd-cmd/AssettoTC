import React, { useState } from 'react';

function ReplayUploader({ onFileSelect, isLoading }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.acreplay')) {
      setFile(selectedFile);
    } else {
      setFile(null);
      alert('Please select a valid .acreplay file');
    }
  };

  return (
    <div className="replay-uploader">
      <h2>Upload Replay File</h2>
      
      <div className="file-input-container">
        <input
          type="file"
          accept=".acreplay"
          onChange={handleFileChange}
          disabled={isLoading}
          id="replay-file-input"
        />
        <label htmlFor="replay-file-input" className="file-input-label">
          {file ? file.name : "Select .acreplay file"}
        </label>
        <button 
          className="parse-button" 
          onClick={() => onFileSelect(file)} 
          disabled={!file || isLoading}>
          {isLoading ? "Processing..." : "Parse Replay"}
        </button>
      </div>
    </div>
  );
}

export default ReplayUploader;