import React from 'react';
import TelemetryItem from './TelemetryItem';

function TelemetryDisplay({ cars, globalFrame }) {
    // Check if we have any cars to display
    if (!cars || cars.length === 0) {
        return (
            <div className="telemetry" id="telemetryDisplay">
                <div className="telemetry-empty-message">
                    No car data available. Please load a telemetry file.
                </div>
            </div>
        );
    }
    
    return (
        <div className="telemetry" id="telemetryDisplay">
            {cars.map((car) => (
                <TelemetryItem
                    key={car.id}
                    car={car}
                    globalFrame={globalFrame}
                />
            ))}
        </div>
    );
}

export default React.memo(TelemetryDisplay); // Use React.memo to prevent unnecessary re-renders
