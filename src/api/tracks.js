// Master track list URL - the only hardcoded URL in the application
const MASTER_TRACK_LIST_URL = 'https://raw.githubusercontent.com/qwertysd-cmd/actrack/main/test.json';

/**
 * Fetches the master track list from the GitHub repository
 * @returns {Promise<Array>} Array of track objects
 */
export const fetchTrackList = async () => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${MASTER_TRACK_LIST_URL}?_=${timestamp}`;
    
    console.log('Fetching track list from:', url);
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch track list (Status: ${response.status})`);
    }
    
    const data = await response.json();
    
    // Process the data depending on its structure
    if (Array.isArray(data)) {
      // If it's already an array of tracks, add IDs using displayName if missing
      return data.map((track, index) => ({
        ...track,
        id: track.id || track.displayName || `track${index + 1}`
      }));
    } else if (data.tracks && Array.isArray(data.tracks)) {
      // If tracks are nested in a 'tracks' property
      return data.tracks.map((track, index) => ({
        ...track,
        id: track.id || track.displayName || `track${index + 1}`
      }));
    } else {
      // If it's a single track object, convert to an array with one element
      return [{
        ...data,
        id: data.id || data.displayName || "track1",
        name: data.name || data.displayName || "Track",
        displayName: data.displayName || "Track",
        transform: data.transform || { x: 0, y: 0, scale: 1, rotation: 0 }
      }];
    }
  } catch (error) {
    console.error('Error fetching track list:', error);
    throw error;
  }
};

/**
 * Fetches a reference lap data from the specified URL
 * @param {string} url - URL to the reference lap JSON
 * @returns {Promise<Object>} Reference lap data
 */
export const fetchReferenceLap = async (url) => {
  try {
    // Convert jsdelivr URL to raw GitHub URL if needed
    const referenceLapUrl = url.includes('cdn.jsdelivr.net/gh/') 
      ? url
          .replace('cdn.jsdelivr.net/gh/', 'raw.githubusercontent.com/')
          .replace('@', '/') 
      : url;
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const urlWithTimestamp = `${referenceLapUrl}?_=${timestamp}`;
    
    console.log('Fetching reference lap from:', urlWithTimestamp);
    const response = await fetch(urlWithTimestamp);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reference lap (Status: ${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reference lap:', error);
    throw error;
  }
};
