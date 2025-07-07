import React from 'react';

function CarSection({
    car,
    focusedCarId,
    handleFileChange,
    handleCarNumberChange,
    handleCarChange,
    handleTrailLengthAdjust,
    handleFocusChange,
    resetCar,
    isRefCarVisible,
    toggleRefCarVisibility
}) {
    const isFocused = focusedCarId === car.id;
    const isReferenceCar = car.id === 0;

    // Determine display name
    let displayName = isReferenceCar ? "Eduardo (Ref)" : "You";

    return (
        <div className="car-section" data-car-id={car.id}>
            <h4 style={{ color: car.color }}>{displayName}</h4>
            <div className="control-group">
                {/* File input only for non-reference cars */}
                {!isReferenceCar && (
                    <div className="control-item">
                        <label htmlFor={`fileInput_${car.id}`} className="file-input-label">Load JSON</label>
                        <input type="file" id={`fileInput_${car.id}`} accept=".json" onChange={(e) => handleFileChange(car.id, e)} />
                        <span id={`fileName_${car.id}`} className="file-name-display">{car.fileName}</span>
                    </div>
                )}
                {/* Show file name for reference car if it exists */}
                {isReferenceCar && car.fileName && (
                    <div className="control-item">
                        <span className="file-name-display">File: {car.fileName}</span>
                    </div>
                )}
                <div className="control-item">
                    <label htmlFor={`trailWidth_${car.id}`}>Trail Width:</label>
                    <input type="number" id={`trailWidth_${car.id}`} step="0.1" min="0.1" value={car.trailWidth} onChange={(e) => handleCarNumberChange(car.id, 'trailWidth', e.target.value)} />
                </div>
                <div className="control-item">
                    <label htmlFor={`trailLength_${car.id}`}>Trail Length:</label>
                    <input type="number" id={`trailLength_${car.id}`} step="100" min="0" value={car.trailLength} onChange={(e) => handleCarNumberChange(car.id, 'trailLength', e.target.value)} />
                    <button className="decreaseTrailBtn" data-car-id={car.id} onClick={() => handleTrailLengthAdjust(car.id, -100)}>-100</button>
                    <button className="increaseTrailBtn" data-car-id={car.id} onClick={() => handleTrailLengthAdjust(car.id, 100)}>+100</button>
                </div>
            </div>
            <div className="control-group">
                {/* Phase Shift only for user car */}
                {!isReferenceCar && (
                    <div className="control-item">
                        <label htmlFor={`phaseShift_${car.id}`}>Phase Shift:</label>
                        <input type="number" id={`phaseShift_${car.id}`} step="1" value={car.phaseShift} onChange={(e) => handleCarNumberChange(car.id, 'phaseShift', e.target.value)} />
                    </div>
                )}
                
                {/* Show/Hide Toggle for Reference Car */}
                {isReferenceCar ? (
                    <div className="control-item">
                        <button onClick={toggleRefCarVisibility}>
                            {isRefCarVisible ? 'Hide Eduardo' : 'Show Eduardo'}
                        </button>
                    </div>
                ) : (
                    <div className="control-item">
                        <button onClick={() => resetCar(car.id)}>Reset Car</button>
                    </div>
                )}
            </div>
        </div>
    );
}


export default CarSection;
