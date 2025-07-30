/**
 * Utility to normalize telemetry data to a reference recording interval.
 * Upsamples (interpolates) when input interval is larger than reference interval,
 * and downsamples (subsamples) when input interval is smaller.
 */

/**
 * Normalizes telemetry data to match the reference recording interval
 * @param {Object} telemetryData - The telemetry data to normalize, with fields: recordingInterval, numFrames, x, z, rotY, and optional rpm, throttle, brake, gear, steering
 * @param {number} referenceInterval - The target recording interval in milliseconds
 * @returns {Object} - Normalized telemetry data with the reference interval
 */
export function normalizeTelemetryData(telemetryData, referenceInterval) {
  // Validate input
  if (!telemetryData ||
    !Number.isFinite(telemetryData.recordingInterval) || telemetryData.recordingInterval <= 0 ||
    !Number.isFinite(telemetryData.numFrames) || telemetryData.numFrames <= 0 ||
    !Array.isArray(telemetryData.x) || !Array.isArray(telemetryData.z) || !Array.isArray(telemetryData.rotY)) {
    console.warn("Cannot normalize telemetry data: Missing or invalid required fields (recordingInterval, numFrames, x, z, rotY)");
  return telemetryData;
    }

    // If intervals match exactly, return unchanged
    if (telemetryData.recordingInterval === referenceInterval) {
      console.log(`Telemetry data already at ${referenceInterval}ms interval, no normalization needed`);
      return telemetryData;
    }

    console.log(`Normalizing telemetry from ${telemetryData.recordingInterval}ms to ${referenceInterval}ms`);

    // Calculate the ratio of input interval to reference interval
    const ratio = telemetryData.recordingInterval / referenceInterval;
    const isUpsampling = ratio > 1; // e.g., 30ms to 15ms (more frames needed)
    const isDownsampling = ratio < 1; // e.g., 10ms to 15ms (fewer frames needed)

    // Calculate new number of frames
    const inputDuration = telemetryData.numFrames * telemetryData.recordingInterval;
    const newNumFrames = Math.round(inputDuration / referenceInterval);

    // Initialize normalized data object
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

    // Helper function for linear interpolation
    const interpolate = (field, origIndex) => {
      if (!telemetryData[field]) return undefined;

      const lowerIndex = Math.floor(origIndex);
      const upperIndex = Math.min(Math.ceil(origIndex), telemetryData.numFrames - 1);
      const factor = origIndex - lowerIndex;

      if (lowerIndex === upperIndex) {
        return telemetryData[field][lowerIndex];
      }

      return telemetryData[field][lowerIndex] * (1 - factor) + telemetryData[field][upperIndex] * factor;
    };

    // Helper function for nearest-neighbor selection (for discrete values)
    const selectNearest = (field, origIndex) => {
      if (!telemetryData[field]) return undefined;
      return telemetryData[field][Math.round(origIndex)];
    };

    if (isUpsampling) {
      // Upsampling: Interpolate to create more frames
      for (let i = 0; i < newNumFrames; i++) {
        // Map new frame index to original timeline
        const origIndex = i / ratio;

        // Interpolate continuous fields
        normalized.x[i] = interpolate('x', origIndex);
        normalized.z[i] = interpolate('z', origIndex);
        normalized.rotY[i] = interpolate('rotY', origIndex);
        if (normalized.rpm) normalized.rpm[i] = interpolate('rpm', origIndex);
        if (normalized.throttle) normalized.throttle[i] = interpolate('throttle', origIndex);
        if (normalized.brake) normalized.brake[i] = interpolate('brake', origIndex);
        if (normalized.steering) normalized.steering[i] = interpolate('steering', origIndex);

        // Use nearest-neighbor for discrete fields
        if (normalized.gear) normalized.gear[i] = selectNearest('gear', origIndex);
      }
    } else if (isDownsampling) {
      // Downsampling: Select frames to reduce frame count
      for (let i = 0; i < newNumFrames; i++) {
        // Map new frame index to original timeline
        const origIndex = Math.round(i / ratio);

        // Ensure index is within bounds
        const safeIndex = Math.min(origIndex, telemetryData.numFrames - 1);

        // Copy values directly for all fields
        normalized.x[i] = telemetryData.x[safeIndex];
        normalized.z[i] = telemetryData.z[safeIndex];
        normalized.rotY[i] = telemetryData.rotY[safeIndex];
        if (normalized.rpm) normalized.rpm[i] = telemetryData.rpm[safeIndex];
        if (normalized.throttle) normalized.throttle[i] = telemetryData.throttle[safeIndex];
        if (normalized.brake) normalized.brake[i] = telemetryData.brake[safeIndex];
        if (normalized.gear) normalized.gear[i] = telemetryData.gear[safeIndex];
        if (normalized.steering) normalized.steering[i] = telemetryData.steering[safeIndex];
      }
    }

    console.log(`Normalized to ${newNumFrames} frames (original: ${telemetryData.numFrames} frames)`);
    return normalized;
}
