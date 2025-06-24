import React, { useState } from 'react';
import { getTrackConfig, getReferenceLap } from '../api/tracks';

const TrackSelector = ({ onTrackSelected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectTrack = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch track configuration from CDN with timestamp to bust cache
      const timestamp = new Date().getTime();
      console.log(`Fetching track config with cache-busting timestamp: ${timestamp}`);
      
      // Fetch track configuration from CDN
      const trackConfig = await getTrackConfig();
      
      // If reference lap URL is provided, fetch it
      let referenceLapData = null;
      if (trackConfig.referenceLapUrl) {
        referenceLapData = await getReferenceLap(trackConfig.referenceLapUrl);
      }
      
      // Pass the complete track data to parent component
      onTrackSelected({
        ...trackConfig,
        referenceLapData
      });
    } catch (err) {
      setError(err.message);
      console.error("Track selection error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-selector">
      <button 
        onClick={handleSelectTrack} 
        disabled={loading}
        className="select-track-button"
      >
        {loading ? 'Loading...' : 'Select Track'}
      </button>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default TrackSelector;
