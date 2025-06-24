import React from 'react';

const MAX_RPM = 10000; // Should ideally come from props or config if variable

function TelemetryItem({ car, globalFrame }) {
    const getTelemetryValues = (car) => {
        if (!car.telemetryData) return { rpm: 0, throttle: 0, brake: 0, rpmPercent: 0 };

        const frameIndex = globalFrame + car.phaseShift - (car.trimStart || 0);
        const carFrame = Math.min(
            Math.max(0, frameIndex),
            car.telemetryData.numFrames - 1
        );

        if (carFrame >= 0 && carFrame < car.telemetryData.numFrames) {
            const rpm = car.telemetryData.rpm ? car.telemetryData.rpm[carFrame] : 0;
            const throttle = car.telemetryData.throttle ? car.telemetryData.throttle[carFrame] : 0;
            const brake = car.telemetryData.brake ? car.telemetryData.brake[carFrame] : 0;
            return {
                rpm: Math.round(rpm),
                throttle: Math.round((throttle / 255) * 100),
                brake: Math.round((brake / 255) * 100),
                rpmPercent: Math.min(100, (rpm / MAX_RPM) * 100)
            };
        }
        return { rpm: 0, throttle: 0, brake: 0, rpmPercent: 0 };
    };

    const { rpm, throttle, brake, rpmPercent } = getTelemetryValues(car);

    let displayName = `Car ${car.id}`;
    if (car.id === 0) displayName = "Eduardo (Ref)";
    else if (car.id === 1) displayName = "You";

    return (
        <div className="telemetry-item" data-car-id={car.id} style={{borderColor: car.color}}>
            <div className="telemetry-item-header">{displayName}</div>
            <div className="telemetry-label">RPM</div>
            <div className="progress-bar rpm-bar">
                <div id={`rpmFill_${car.id}`} className="progress-fill rpm-fill" style={{ width: `${rpmPercent}%` }}></div>
            </div>
            <div id={`rpmValue_${car.id}`} className="telemetry-value">{rpm}</div>

            <div className="telemetry-label">Throttle</div>
            <div className="progress-bar throttle-bar">
                <div id={`throttleFill_${car.id}`} className="progress-fill throttle-fill" style={{ width: `${throttle}%` }}></div>
            </div>
            <div id={`throttleValue_${car.id}`} className="telemetry-value">{throttle}%</div>

            <div className="telemetry-label">Brake</div>
            <div className="progress-bar brake-bar">
                <div id={`brakeFill_${car.id}`} className="progress-fill brake-fill" style={{ width: `${brake}%` }}></div>
            </div>
            <div id={`brakeValue_${car.id}`} className="telemetry-value">{brake}%</div>
        </div>
    );
}

export default React.memo(TelemetryItem);
