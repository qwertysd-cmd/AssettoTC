/**
 * Assetto Corsa Replay Parser
 * JavaScript implementation for browser-based parsing of .acreplay files
 */

// Read a length-prefixed string from the binary data
function readString(dataView, offset) {
  try {
    // Check if we have enough bytes for the length prefix
    if (offset + 4 > dataView.byteLength) {
      throw new Error("Not enough bytes to read string length");
    }
    
    const length = dataView.getUint32(offset, true);
    offset += 4;
    
    // Validate string length to prevent buffer overruns
    if (length < 0 || offset + length > dataView.byteLength) {
      throw new Error(`Invalid string length (${length}) at offset ${offset - 4}`);
    }
    
    // Create a Uint8Array slice of the string data
    const stringData = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, length);
    
    // Convert to a string using TextDecoder
    const decoder = new TextDecoder('utf-8');
    return {
      value: decoder.decode(stringData),
      newOffset: offset + length
    };
  } catch (e) {
    throw new Error(`Error reading string: ${e.message}`);
  }
}

// Read various data types from the binary data
function readValue(dataView, offset, dataType) {
  try {
    // Check if we have enough bytes to read the value
    if (offset >= dataView.byteLength) {
      throw new Error(`Buffer overrun at offset ${offset}, buffer length ${dataView.byteLength}`);
    }
    
    switch (dataType) {
      case "int32":
        if (offset + 4 > dataView.byteLength) {
          throw new Error(`Not enough bytes to read int32 at offset ${offset}`);
        }
        return { value: dataView.getInt32(offset, true), newOffset: offset + 4 };
      case "uint32":
        if (offset + 4 > dataView.byteLength) {
          throw new Error(`Not enough bytes to read uint32 at offset ${offset}`);
        }
        return { value: dataView.getUint32(offset, true), newOffset: offset + 4 };
      case "uint8":
        if (offset + 1 > dataView.byteLength) {
          throw new Error(`Not enough bytes to read uint8 at offset ${offset}`);
        }
        return { value: dataView.getUint8(offset), newOffset: offset + 1 };
      case "double":
        if (offset + 8 > dataView.byteLength) {
          throw new Error(`Not enough bytes to read double at offset ${offset}`);
        }
        return { value: dataView.getFloat64(offset, true), newOffset: offset + 8 };
      case "float":
        if (offset + 4 > dataView.byteLength) {
          throw new Error(`Not enough bytes to read float at offset ${offset}`);
        }
        return { value: dataView.getFloat32(offset, true), newOffset: offset + 4 };
      case "float16":
        // JavaScript doesn't natively support float16, so we implement a simplified version
        if (offset + 2 > dataView.byteLength) {
          throw new Error(`Not enough bytes to read float16 at offset ${offset}`);
        }
        // This converts the 16-bit half-precision float to a regular float
        const uint16 = dataView.getUint16(offset, true);
        let sign = (uint16 & 0x8000) ? -1 : 1;
        let exponent = (uint16 & 0x7C00) >> 10;
        let fraction = uint16 & 0x03FF;
        
        let float32;
        if (exponent === 0) {
          if (fraction === 0) {
            float32 = sign * 0;
          } else {
            // Denormalized number
            float32 = sign * fraction * Math.pow(2, -10 - 14);
          }
        } else if (exponent === 0x1F) {
          float32 = fraction === 0 ? sign * Infinity : NaN;
        } else {
          // Normalized number
          float32 = sign * Math.pow(2, exponent - 15) * (1 + fraction / 0x400);
        }
        
        return { value: float32, newOffset: offset + 2 };
      case "string":
        return readString(dataView, offset);
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  } catch (e) {
    throw new Error(`Error reading value (type ${dataType}): ${e.message}`);
  }
}

// Extract driver names from the INI section of the replay
function getDriverNamesFromIni(dataView, fileSize) {
  const names = [];
  const POSTFIX_STR = "__AC_SHADERS_PATCH_v1__";
  const DRIVER_NAME_INI_STR = "DRIVER_NAME=";
  
  try {
    // Check if we have a valid file size
    if (fileSize <= POSTFIX_STR.length + 8) {
      return names; // File too small, return empty array
    }
    
    // Check for shaders patch signature at the end, similar to C++ version
    let offset = fileSize - POSTFIX_STR.length - 8;
    
    // Ensure we don't read beyond the buffer's bounds
    if (offset < 0 || offset + POSTFIX_STR.length > dataView.byteLength) {
      return names;
    }
    
    // Read signature bytes
    const signatureBytes = new Uint8Array(
      dataView.buffer, 
      dataView.byteOffset + offset, 
      POSTFIX_STR.length
    );
    const decoder = new TextDecoder('utf-8');
    const signature = decoder.decode(signatureBytes);
    
    if (signature === POSTFIX_STR) {
      offset += POSTFIX_STR.length;
      
      // Read the offset to extra data
      if (offset + 4 > dataView.byteLength) return names;
      let result = readValue(dataView, offset, "int32");
      const extraDataStartOffset = result.value;
      offset = result.newOffset;
      
      // Read INI version
      if (offset + 4 > dataView.byteLength) return names;
      result = readValue(dataView, offset, "int32");
      const iniVersion = result.value;
      
      if (iniVersion === 1 && extraDataStartOffset > 0 && 
          extraDataStartOffset < dataView.byteLength) {
        // Jump to the start of the extra data section
        offset = extraDataStartOffset;
        
        // Skip sections until finding the INI content (similar to C++ implementation)
        while (offset + 4 <= dataView.byteLength) {
          const sectionLengthResult = readValue(dataView, offset, "int32");
          const sectionLength = sectionLengthResult.value;
          
          // Similar to C++ implementation, use a heuristic to find the INI section
          // INI content length is usually large
          if (sectionLength > 255) {
            offset = offset; // Stay at the current position to read the INI content
            break;
          }
          
          if (sectionLength <= 0) {
            break; // Invalid section length, stop searching
          }
          
          // Move to the next section
          offset = sectionLengthResult.newOffset + sectionLength;
          
          // Check if we're still within bounds
          if (offset >= dataView.byteLength) {
            break;
          }
        }
        
        // Check if we still have enough data to read the INI string
        if (offset + 4 <= dataView.byteLength) {
          try {
            const iniContentResult = readValue(dataView, offset, "string");
            const iniContent = iniContentResult.value;
            
            // Find driver names in the INI content
            let startSearchIndex = 0;
            
            while (true) {
              const startIndex = iniContent.indexOf(DRIVER_NAME_INI_STR, startSearchIndex);
              if (startIndex === -1) break;
              
              const nameStartIndex = startIndex + DRIVER_NAME_INI_STR.length;
              const endIndex = iniContent.indexOf("\n", nameStartIndex);
              const nameEndIndex = endIndex === -1 ? iniContent.length : endIndex;
              
              let name = iniContent.substring(nameStartIndex, nameEndIndex).trim();
              
              // Remove surrounding quotes if present
              if (name.length >= 2 && name.startsWith("'") && name.endsWith("'")) {
                name = name.substring(1, name.length - 1);
              }
              
              if (name) {
                names.push(name);
              }
              
              startSearchIndex = nameEndIndex;
            }
          } catch (e) {
            // Silently ignore errors in INI parsing
          }
        }
      }
    }
  } catch (e) {
    // Silently ignore errors; getting names is best-effort
  }
  
  return names;
}

// Normalize name for comparison (lowercase and remove extra spaces)
function normalizeNameForComparison(name) {
  return name.toLowerCase().trim();
}

// Main parser function
export async function parseReplayForDriver(file, targetDriverName) {
  try {
    const buffer = await file.arrayBuffer();
    const dataView = new DataView(buffer);
    let offset = 0;
    
    // Read Header
    let result = readValue(dataView, offset, "int32");
    const version = result.value;
    offset = result.newOffset;
    
    if (version !== 16) {
      throw new Error("Unsupported replay version. Only version 16 is supported.");
    }
    
    // Read recording interval
    result = readValue(dataView, offset, "double");
    const recordingIntervalMs = result.value;
    offset = result.newOffset;
    
    // Skip weather_id, track_id, track_config
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    
    // Read number of cars
    result = readValue(dataView, offset, "int32");
    const numCars = result.value;
    offset = result.newOffset;
    
    // Skip current recording index
    result = readValue(dataView, offset, "int32");
    offset = result.newOffset;
    
    // --- Find Target Driver Index ---
    // Try reading names from INI first (more reliable if available)
    const driverNames = getDriverNamesFromIni(dataView, buffer.byteLength);
    let targetIndex = -1;
    
    // Normalize the target driver name for comparison
    const normalizedTargetName = normalizeNameForComparison(targetDriverName);
    
    if (driverNames.length > 0) {
      // First try exact match (case-insensitive)
      targetIndex = driverNames.findIndex(name => 
        normalizeNameForComparison(name) === normalizedTargetName);
      
      // If not found, try partial match (e.g. if target is "Suraj" and name is "suraj nagisetty")
      if (targetIndex === -1) {
        targetIndex = driverNames.findIndex(name => 
          normalizeNameForComparison(name).includes(normalizedTargetName) || 
          normalizedTargetName.includes(normalizeNameForComparison(name)));
      }
      
      if (targetIndex === -1) {
        throw new Error(`Driver '${targetDriverName}' not found in replay INI metadata.`);
      }
    } else {
      // Fallback: Read names sequentially (less reliable if INI missing/corrupt)
      // This requires seeking past track object data first
      result = readValue(dataView, offset, "int32");
      const numFrames = result.value;
      offset = result.newOffset;
      
      result = readValue(dataView, offset, "int32");
      const numTrackObjects = result.value;
      offset = result.newOffset;
      
      // Skip track objects data
      const skipSize = (2 + 2 + 12 * numTrackObjects) * numFrames;
      offset += skipSize;
      
      let found = false;
      for (let i = 0; i < numCars; i++) {
        const carIdResult = readValue(dataView, offset, "string");
        offset = carIdResult.newOffset;
        
        const driverNameResult = readValue(dataView, offset, "string");
        const driverNameTemp = driverNameResult.value;
        offset = driverNameResult.newOffset;
        
        // Use flexible matching instead of strict equality
        const normalizedName = normalizeNameForComparison(driverNameTemp);
        if (normalizedName === normalizedTargetName || 
            normalizedName.includes(normalizedTargetName) || 
            normalizedTargetName.includes(normalizedName)) {
          targetIndex = i;
          found = true;
          // Seek back to start of car metadata block
          offset -= (4 + new TextEncoder().encode(carIdResult.value).length + 
                    4 + new TextEncoder().encode(driverNameTemp).length);
          break;
        } else {
          // Skip remaining metadata and frame data for this car
          result = readValue(dataView, offset, "string"); // nation_code
          offset = result.newOffset;
          result = readValue(dataView, offset, "string"); // driver_team
          offset = result.newOffset;
          result = readValue(dataView, offset, "string"); // car_skin_id
          offset = result.newOffset;
          
          const framesResult = readValue(dataView, offset, "int32");
          const framesTemp = framesResult.value;
          offset = framesResult.newOffset;
          
          const bufferIncResult = readValue(dataView, offset, "int32");
          const bufferIncTemp = bufferIncResult.value;
          offset = bufferIncResult.newOffset;
          
          // Skip car data
          const skipCarData = 20 + (255 + (21 + bufferIncTemp * 4)) * (framesTemp - 1) + 
                             (255 + (5 + bufferIncTemp * 4));
          offset += skipCarData;
        }
      }
      
      if (!found) {
        throw new Error(`Driver '${targetDriverName}' not found by sequential scan.`);
      }
    }
    
    // --- Skip to Target Car Data ---
    if (!driverNames.length) {
      // If we did sequential scan, we are already at the start of the target car's data
    } else {
      // If we used INI, skip track objects and preceding cars
      result = readValue(dataView, offset, "int32");
      const numFrames = result.value;
      offset = result.newOffset;
      
      result = readValue(dataView, offset, "int32");
      const numTrackObjects = result.value;
      offset = result.newOffset;
      
      // Skip track objects data
      const skipTrackData = (2 + 2 + 12 * numTrackObjects) * numFrames;
      offset += skipTrackData;
      
      // Skip preceding cars
      for (let c = 0; c < targetIndex; c++) {
        result = readValue(dataView, offset, "string"); // car_id
        offset = result.newOffset;
        result = readValue(dataView, offset, "string"); // driver_name
        offset = result.newOffset;
        result = readValue(dataView, offset, "string"); // nation_code
        offset = result.newOffset;
        result = readValue(dataView, offset, "string"); // driver_team
        offset = result.newOffset;
        result = readValue(dataView, offset, "string"); // car_skin_id
        offset = result.newOffset;
        
        const framesCarResult = readValue(dataView, offset, "int32");
        const framesCar = framesCarResult.value;
        offset = framesCarResult.newOffset;
        
        const bufferIncrementCarResult = readValue(dataView, offset, "int32");
        const bufferIncrementCar = bufferIncrementCarResult.value;
        offset = bufferIncrementCarResult.newOffset;
        
        // Skip car data
        const skipCarSize = 20 + (255 + (21 + bufferIncrementCar * 4)) * (framesCar - 1) + 
                           (255 + (5 + bufferIncrementCar * 4));
        offset += skipCarSize;
      }
    }
    
    // --- Read Target Car Data ---
    result = readValue(dataView, offset, "string"); // car_id
    offset = result.newOffset;
    
    result = readValue(dataView, offset, "string"); // driver_name
    const driverName = result.value;
    offset = result.newOffset;
    
    // Use the same flexible matching logic for verification
    const normalizedFoundName = normalizeNameForComparison(driverName);
    if (normalizedFoundName !== normalizedTargetName && 
        !normalizedFoundName.includes(normalizedTargetName) && 
        !normalizedTargetName.includes(normalizedFoundName)) {
      throw new Error(`Mismatch: Expected driver '${targetDriverName}', found '${driverName}' at index ${targetIndex}.`);
    }
    
    // Skip nation_code, driver_team, car_skin_id
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    
    // Read frames count and buffer increment
    result = readValue(dataView, offset, "int32");
    const frames = result.value;
    offset = result.newOffset;
    
    result = readValue(dataView, offset, "int32");
    const bufferIncrementValue = result.value;
    offset = result.newOffset;
    
    // Skip 20 bytes of unknown data
    offset += 20;
    
    // Initialize data arrays for required fields
    const x = new Array(frames);
    const z = new Array(frames);
    const rotY = new Array(frames);
    const rpm = new Array(frames);
    const steering = new Array(frames);
    const throttle = new Array(frames);
    const brake = new Array(frames);
    const gear = new Array(frames);
    
    // Read frame data
    for (let i = 0; i < frames; i++) {
      // Read X position
      result = readValue(dataView, offset, "float");
      x[i] = result.value;
      offset = result.newOffset;
      
      // Skip Y position (but still read it)
      result = readValue(dataView, offset, "float");
      offset = result.newOffset;
      
      // Read Z position (and invert)
      result = readValue(dataView, offset, "float");
      z[i] = -result.value;
      offset = result.newOffset;
      
      // Read Yaw/rotY (and invert)
      result = readValue(dataView, offset, "float16");
      rotY[i] = -result.value;
      offset = result.newOffset;
      
      // Skip rot_x, rot_z, unknown float16 (6 bytes)
      offset += 6;
      
      // Skip brake disc positions (48 bytes)
      offset += 48;
      
      // Skip wheel rotations (24 bytes)
      offset += 24;
      
      // Skip wheel positions (48 bytes)
      offset += 48;
      
      // Skip wheel X rotations (24 bytes)
      offset += 24;
      
      // Skip speed_z, unknown float16, speed_x (6 bytes)
      offset += 6;
      
      // Read RPM
      result = readValue(dataView, offset, "float16");
      rpm[i] = result.value;
      offset = result.newOffset;
      
      // Skip 10 float values (40 bytes)
      offset += 40;
      
      // Read steering (and invert)
      result = readValue(dataView, offset, "float16");
      steering[i] = -result.value;
      offset = result.newOffset;
      
      // Skip 2 bytes + 4 float values (18 bytes)
      offset += 18;
      
      // Read fuel (but don't store)
      result = readValue(dataView, offset, "uint8");
      offset = result.newOffset;
      
      // Skip unknown uint8
      offset += 1;
      
      // Read gear
      result = readValue(dataView, offset, "uint8");
      gear[i] = result.value;
      offset = result.newOffset;
      
      // Skip unknown bytes (5)
      offset += 5;
      
      // Skip damage readings (4 bytes)
      offset += 4;
      
      // Read throttle and brake
      result = readValue(dataView, offset, "uint8");
      throttle[i] = result.value;
      offset = result.newOffset;
      
      result = readValue(dataView, offset, "uint8");
      brake[i] = result.value;
      offset = result.newOffset;
      
      // Skip unknown bytes (2)
      offset += 2;
      
      // Read bit field (but don't store)
      result = readValue(dataView, offset, "uint8");
      offset = result.newOffset;
      
      // Skip unknown bytes (5)
      offset += 5;
      
      // Read boost (but don't store)
      result = readValue(dataView, offset, "uint8");
      offset = result.newOffset;
      
      // Skip remaining buffer increment data
      const skipExtra = bufferIncrementValue * 4;
      if (i < frames - 1) {
        offset += 21 + skipExtra;
      }
    }
    
    // Build JSON data
    const jsonData = {
      numFrames: frames,
      recordingInterval: recordingIntervalMs,
      x: x,
      z: z,
      rotY: rotY,
      rpm: rpm,
      steering: steering,
      throttle: throttle,
      brake: brake,
      gear: gear,
    };
    
    return jsonData;
  } catch (error) {
    throw new Error(`Error parsing replay: ${error.message}`);
  }
}

// Get list of all drivers from a replay file - improved with better error handling
export async function getDriversFromReplay(file) {
  try {
    const buffer = await file.arrayBuffer();
    const dataView = new DataView(buffer);
    
    // First try to get names from INI metadata (more reliable)
    const namesFromIni = getDriverNamesFromIni(dataView, buffer.byteLength);
    if (namesFromIni.length > 0) {
      return namesFromIni;
    }
    
    // Fallback to sequential scan
    let offset = 0;
    
    // Read version
    let result = readValue(dataView, offset, "int32");
    const version = result.value;
    offset = result.newOffset;
    
    if (version !== 16) {
      throw new Error("Unsupported replay version. Only version 16 is supported.");
    }
    
    // Skip recording interval
    result = readValue(dataView, offset, "double");
    offset = result.newOffset;
    
    // Skip weather_id, track_id, track_config
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    result = readValue(dataView, offset, "string");
    offset = result.newOffset;
    
    // Read number of cars
    result = readValue(dataView, offset, "int32");
    const numCars = result.value;
    offset = result.newOffset;
    
    // Skip current recording index
    result = readValue(dataView, offset, "int32");
    offset = result.newOffset;
    
    // Skip track object data
    result = readValue(dataView, offset, "int32");
    const numFrames = result.value;
    offset = result.newOffset;
    
    result = readValue(dataView, offset, "int32");
    const numTrackObjects = result.value;
    offset = result.newOffset;
    
    // Skip track objects data - make sure we have valid values to prevent buffer overflow
    if (numFrames < 0 || numTrackObjects < 0 || 
        numFrames > 100000 || numTrackObjects > 10000) {
      throw new Error("Invalid frame or track object count");
    }
    
    const skipSize = (2 + 2 + 12 * numTrackObjects) * numFrames;
    if (skipSize < 0 || offset + skipSize > dataView.byteLength) {
      throw new Error("Invalid track object data size");
    }
    offset += skipSize;
    
    // Read driver names
    const driverNames = [];
    for (let i = 0; i < numCars && i < 100; i++) { // Limit to 100 cars as a safety check
      // Ensure we don't read beyond the buffer
      if (offset >= dataView.byteLength) {
        break;
      }
      
      result = readValue(dataView, offset, "string"); // car_id
      offset = result.newOffset;
      
      if (offset >= dataView.byteLength) {
        break;
      }
      
      result = readValue(dataView, offset, "string"); // driver_name
      const driverName = result.value;
      driverNames.push(driverName);
      offset = result.newOffset;
      
      // Skip remaining metadata
      if (offset >= dataView.byteLength) break;
      result = readValue(dataView, offset, "string"); // nation_code
      offset = result.newOffset;
      
      if (offset >= dataView.byteLength) break;
      result = readValue(dataView, offset, "string"); // driver_team
      offset = result.newOffset;
      
      if (offset >= dataView.byteLength) break;
      result = readValue(dataView, offset, "string"); // car_skin_id
      offset = result.newOffset;
      
      // Read frames and buffer increment
      if (offset + 8 > dataView.byteLength) break;
      
      result = readValue(dataView, offset, "int32");
      const framesTemp = result.value;
      offset = result.newOffset;
      
      result = readValue(dataView, offset, "int32");
      const bufferIncTemp = result.value;
      offset = result.newOffset;
      
      // Skip car data, but check for valid values first
      if (framesTemp < 0 || framesTemp > 100000 || 
          bufferIncTemp < 0 || bufferIncTemp > 1000) {
        break; // Invalid values, break the loop
      }
      
      const skipCarData = 20 + (255 + (21 + bufferIncTemp * 4)) * (framesTemp - 1) + 
                         (255 + (5 + bufferIncTemp * 4));
                         
      if (skipCarData < 0 || offset + skipCarData > dataView.byteLength) {
        break; // Cannot skip this much, probably invalid data
      }
      offset += skipCarData;
    }
    
    return driverNames;
  } catch (error) {
    throw new Error(`Error getting drivers from replay: ${error.message}`);
  }
}

// Helper function to download generated JSON
export function downloadJson(jsonData, driverName, replayName) {
  const safeDriverName = driverName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeReplayName = (replayName || 'replay').replace(/\.acreplay$/, '');
  const filename = `${safeReplayName}_${safeDriverName}_telemetry.json`;
  
  const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
  
  return filename;
}