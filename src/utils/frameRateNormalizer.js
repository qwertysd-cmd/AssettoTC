/**
 * Utility to normalize telemetry data from different recording intervals
 * to match a reference recording interval.
 */

/**
 * Normalizes telemetry data to match the reference recording interval
 * @param {Object} telemetryData - The telemetry data to normalize
 * @param {number} referenceInterval - The reference recording interval in milliseconds
 * @returns {Object} - Normalized telemetry data
 */
export function normalizeTelemetryData(telemetryData, referenceInterval) {
  // If no telemetry data or missing required fields, return as is
  if (!telemetryData || !telemetryData.recordingInterval || 
      !telemetryData.numFrames || !telemetryData.x || !telemetryData.z || !telemetryData.rotY) {
    console.warn("Cannot normalize telemetry data: Missing required fields");
    return telemetryData;
  }
  
  // If intervals are the same, no need to normalize
  if (telemetryData.recordingInterval === referenceInterval) {
    console.log("Telemetry data already matches reference interval");
    return telemetryData;
  }
  
  const ratio = telemetryData.recordingInterval / referenceInterval;
  
  // If this ratio is close to 1 (within 5%), consider them equal to avoid unnecessary processing
  if (Math.abs(ratio - 1) < 0.05) {
    console.log(`Recording intervals close enough (ratio: ${ratio.toFixed(2)}), skipping normalization`);
    return telemetryData;
  }
  
  console.log(`Normalizing telemetry data from ${telemetryData.recordingInterval}ms to ${referenceInterval}ms (ratio: ${ratio.toFixed(2)})`);
  
  // Calculate new number of frames
  const newNumFrames = Math.round(telemetryData.numFrames * ratio);
  
  // Create new arrays for all data fields
  const normalized = {
    ...telemetryData,
    recordingInterval: referenceInterval,
    numFrames: newNumFrames,
    x: new Array(newNumFrames),
    z: new Array(newNumFrames),
    rotY: new Array(newNumFrames),
    rpm: telemetryData.rpm ? new Array(newNumFrames) : undefined,
    throttle: telemetryData.throttle ? new Array(newNumFrames) : undefined,
    brake: telemetryData.brake ? new Array(newNumFrames) : undefined,
    gear: telemetryData.gear ? new Array(newNumFrames) : undefined,
    steering: telemetryData.steering ? new Array(newNumFrames) : undefined
  };
  
  // Interpolate values for each new frame
  for (let i = 0; i < newNumFrames; i++) {
    // Convert the new frame index back to the original timeline
    const origIndex = i / ratio;
    
    // Find the two surrounding frames in the original data
    const lowerIndex = Math.floor(origIndex);
    const upperIndex = Math.min(Math.ceil(origIndex), telemetryData.numFrames - 1);
    
    // Calculate interpolation factor (0-1)
    const factor = origIndex - lowerIndex;
    
    // Helper to interpolate a value
    const interpolate = (field) => {
      if (!telemetryData[field]) return undefined;
      
      // Simple linear interpolation
      if (lowerIndex === upperIndex) {
        return telemetryData[field][lowerIndex];
      }
      
      return telemetryData[field][lowerIndex] * (1 - factor) + telemetryData[field][upperIndex] * factor;
    };
    
    // Apply interpolation to all data fields
    normalized.x[i] = interpolate('x');
    normalized.z[i] = interpolate('z');
    normalized.rotY[i] = interpolate('rotY');
    
    if (normalized.rpm) normalized.rpm[i] = interpolate('rpm');
    if (normalized.throttle) normalized.throttle[i] = interpolate('throttle');
    if (normalized.brake) normalized.brake[i] = interpolate('brake');
    
    // For discrete values like gear, we should not interpolate but use the nearest value
    if (normalized.gear) normalized.gear[i] = telemetryData.gear[Math.round(origIndex)];
    
    // For steering, we can interpolate normally
    if (normalized.steering) normalized.steering[i] = interpolate('steering');
  }
  
  return normalized;
}
