import React from 'react';
import CarSection from './CarSection';

function CarControls({
    cars,
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
    return (
        <div className="control-section" id="carControls">
            <h3>Car Telemetry Controls</h3>
            <div id="carSections">
                {cars.map((car) => (
                    <CarSection
                        key={car.id}
                        car={car}
                        focusedCarId={focusedCarId}
                        handleFileChange={handleFileChange}
                        handleCarNumberChange={handleCarNumberChange}
                        handleCarChange={handleCarChange}
                        handleTrailLengthAdjust={handleTrailLengthAdjust}
                        handleFocusChange={handleFocusChange}
                        resetCar={resetCar}
                        isRefCarVisible={isRefCarVisible}
                        toggleRefCarVisibility={toggleRefCarVisibility}
                    />
                ))}
            </div>
        </div>
    );
}

export default CarControls;
