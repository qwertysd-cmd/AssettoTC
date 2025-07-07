import React from 'react';
import CarSection from './CarSection';

function CarControls({
    cars,
    handleFileChange,
    handleCarNumberChange,
    handleCarChange,
    handleTrailLengthAdjust,
    resetCar,
    isRefCarVisible,
    toggleRefCarVisibility
}) {
    return (
        <div className="car-controls control-section">

            {cars.map(car => (
                <CarSection
                    key={car.id}
                    car={car}
                    handleFileChange={handleFileChange}
                    handleCarNumberChange={handleCarNumberChange}
                    handleCarChange={handleCarChange}
                    handleTrailLengthAdjust={handleTrailLengthAdjust}
                    resetCar={resetCar}
                    isRefCarVisible={isRefCarVisible}
                    toggleRefCarVisibility={toggleRefCarVisibility}
                />
            ))}
        </div>
    );
}



export default CarControls;
