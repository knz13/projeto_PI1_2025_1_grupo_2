// Motion Integration Module
// Provides advanced sensor fusion, acceleration integration, and motion tracking

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Quaternion {
    w: number;
    x: number;
    y: number;
    z: number;
}

export interface IMUData {
    accel: Vector3;
    gyro: Vector3;
    timestamp: number;
}

export interface GPSData {
    lat: number;
    lon: number;
    alt: number;
    sats: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp?: number;
}

export interface SensorData {
    timestamp: number;
    imu: IMUData;
    gps?: GPSData;
}

export interface MotionState {
    // Integration state
    velocity: Vector3;
    position: Vector3;
    orientation: Quaternion;

    // GPS state
    lastGpsPosition: Vector3 | null;
    gpsVelocity: Vector3;
    gpsAvailable: boolean;
    gpsFixQuality: number;

    // Fusion state
    fusionEnabled: boolean;
    positionConfidence: number;

    // Timing
    lastTimestamp: number;
    sampleRate: number;

    // Calibration and filtering
    accelBias: Vector3;
    gyroBias: Vector3;
    accelScale: number;
    gyroScale: number;
    scaleDetected: boolean;

    // Stationary detection
    stationaryThreshold: number;
    stationaryCount: number;
    isStationary: boolean;

    // Outlier detection
    outlierDetectionEnabled: boolean;
    lastAccelMagnitude: number;

    // Integration buffers
    accelHistory: Vector3[];
    gyroHistory: Vector3[];
    velocityHistory: Vector3[];

    // Noise reduction
    lowPassAlpha: number;
    filteredAccel: Vector3;
    filteredGyro: Vector3;
}

export interface IntegrationResult {
    velocity: Vector3;
    position: Vector3;
    orientation: Quaternion;
    isStationary: boolean;
    gpsPosition: Vector3 | null;
    gpsVelocity: Vector3;
    gpsAvailable: boolean;
    fusedPosition: Vector3;
}

/**
 * Initialize motion state with default parameters
 */
export function initializeMotionState(sampleRate: number = 100, outlierDetection: boolean = false): MotionState {
    return {
        velocity: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
        orientation: { w: 1, x: 0, y: 0, z: 0 },

        lastGpsPosition: null,
        gpsVelocity: { x: 0, y: 0, z: 0 },
        gpsAvailable: false,
        gpsFixQuality: 0,

        fusionEnabled: true,
        positionConfidence: 0.5,

        lastTimestamp: 0,
        sampleRate,

        accelBias: { x: 0, y: 0, z: 0 },
        gyroBias: { x: 0, y: 0, z: 0 },
        accelScale: 9.81 / 16384, // For ±2g range: 16384 LSB/g
        gyroScale: Math.PI / (180 * 131.0), // For ±250°/s range: 131.0 LSB/°/s
        scaleDetected: false,

        stationaryThreshold: 0.5, // m/s² threshold for stationary detection
        stationaryCount: 0,
        isStationary: false,

        outlierDetectionEnabled: outlierDetection,
        lastAccelMagnitude: 9.81,

        accelHistory: [],
        gyroHistory: [],
        velocityHistory: [],

        lowPassAlpha: 0.8, // Low-pass filter coefficient
        filteredAccel: { x: 0, y: 0, z: 0 },
        filteredGyro: { x: 0, y: 0, z: 0 }
    };
}

/**
 * Reset motion state to initial values
 */
export function resetMotionState(state: MotionState): void {
    state.velocity = { x: 0, y: 0, z: 0 };
    state.position = { x: 0, y: 0, z: 0 };
    state.orientation = { w: 1, x: 0, y: 0, z: 0 };
    state.lastGpsPosition = null;
    state.gpsVelocity = { x: 0, y: 0, z: 0 };
    state.stationaryCount = 0;
    state.isStationary = false;
    state.lastTimestamp = 0;
    state.accelHistory = [];
    state.gyroHistory = [];
    state.velocityHistory = [];
    state.filteredAccel = { x: 0, y: 0, z: 0 };
    state.filteredGyro = { x: 0, y: 0, z: 0 };

    console.log('[Motion] Motion state reset');
}

/**
 * Vector utility functions
 */
function vectorMagnitude(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vectorSubtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vectorAdd(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vectorScale(v: Vector3, scale: number): Vector3 {
    return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
}

function vectorLerp(a: Vector3, b: Vector3, t: number): Vector3 {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
    };
}

/**
 * Apply low-pass filter to reduce noise
 */
function applyLowPassFilter(current: Vector3, previous: Vector3, alpha: number): Vector3 {
    return {
        x: alpha * current.x + (1 - alpha) * previous.x,
        y: alpha * current.y + (1 - alpha) * previous.y,
        z: alpha * current.z + (1 - alpha) * previous.z
    };
}

/**
 * Detect and remove gravity bias from acceleration
 */
function removeGravityBias(accel: Vector3, orientation: Quaternion): Vector3 {
    // Simple gravity removal assuming Z-up orientation
    // In a more sophisticated implementation, we'd use the orientation quaternion
    // to properly transform gravity vector
    const gravityMagnitude = 9.81;
    const accelMagnitude = vectorMagnitude(accel);

    // If acceleration is close to gravity magnitude, assume it's mostly gravity
    if (Math.abs(accelMagnitude - gravityMagnitude) < 1.0) {
        return { x: accel.x, y: accel.y, z: accel.z - gravityMagnitude };
    }

    return accel;
}

/**
 * Detect if device is stationary based on acceleration patterns
 */
function detectStationary(accel: Vector3, velocity: Vector3, state: MotionState): boolean {
    const accelMagnitude = vectorMagnitude(accel);
    const velocityMagnitude = vectorMagnitude(velocity);

    // Check if acceleration is close to gravity (device at rest)
    const isLowAccel = Math.abs(accelMagnitude - 9.81) < state.stationaryThreshold;
    const isLowVelocity = velocityMagnitude < 0.1; // 0.1 m/s threshold

    if (isLowAccel && isLowVelocity) {
        state.stationaryCount++;
    } else {
        state.stationaryCount = 0;
    }

    // Consider stationary if conditions met for multiple samples
    const requiredStationaryCount = Math.max(5, state.sampleRate / 10); // At least 0.1 seconds
    return state.stationaryCount >= requiredStationaryCount;
}

/**
 * Convert GPS coordinates to local position (simplified)
 */
function gpsToLocalPosition(gps: GPSData, referenceGps: GPSData | null): Vector3 {
    if (!referenceGps) {
        return { x: 0, y: 0, z: gps.alt || 0 };
    }

    // Simple conversion using Earth radius (more sophisticated implementations would use proper projections)
    const earthRadius = 6371000; // meters
    const latDiff = (gps.lat - referenceGps.lat) * Math.PI / 180;
    const lonDiff = (gps.lon - referenceGps.lon) * Math.PI / 180;

    const x = lonDiff * earthRadius * Math.cos(referenceGps.lat * Math.PI / 180);
    const y = latDiff * earthRadius;
    const z = (gps.alt || 0) - (referenceGps.alt || 0);

    return { x, y, z };
}

/**
 * Update orientation using gyroscope data (simplified integration)
 */
function updateOrientation(gyro: Vector3, orientation: Quaternion, dt: number): Quaternion {
    // Simple quaternion integration
    const gyroMagnitude = vectorMagnitude(gyro);
    if (gyroMagnitude < 0.001) return orientation; // Too small to matter

    const angle = gyroMagnitude * dt;
    const axis = vectorScale(gyro, 1 / gyroMagnitude);

    // Create rotation quaternion
    const s = Math.sin(angle / 2);
    const rotQ: Quaternion = {
        w: Math.cos(angle / 2),
        x: axis.x * s,
        y: axis.y * s,
        z: axis.z * s
    };

    // Multiply quaternions
    return {
        w: orientation.w * rotQ.w - orientation.x * rotQ.x - orientation.y * rotQ.y - orientation.z * rotQ.z,
        x: orientation.w * rotQ.x + orientation.x * rotQ.w + orientation.y * rotQ.z - orientation.z * rotQ.y,
        y: orientation.w * rotQ.y - orientation.x * rotQ.z + orientation.y * rotQ.w + orientation.z * rotQ.x,
        z: orientation.w * rotQ.z + orientation.x * rotQ.y - orientation.y * rotQ.x + orientation.z * rotQ.w
    };
}

/**
 * Main sensor data integration function with GPS fusion
 */
export function integrateSensorData(sensorData: SensorData, state: MotionState): IntegrationResult {
    const dt = state.lastTimestamp > 0 ? (sensorData.timestamp - state.lastTimestamp) / 1000.0 : 0;
    state.lastTimestamp = sensorData.timestamp;

    if (dt <= 0 || dt > 1.0) { // Skip invalid or too large time steps
        return {
            velocity: state.velocity,
            position: state.position,
            orientation: state.orientation,
            isStationary: state.isStationary,
            gpsPosition: state.lastGpsPosition,
            gpsVelocity: state.gpsVelocity,
            gpsAvailable: state.gpsAvailable,
            fusedPosition: state.position
        };
    }

    // Apply scaling to raw sensor data
    const scaledAccel: Vector3 = {
        x: sensorData.imu.accel.x * state.accelScale,
        y: sensorData.imu.accel.y * state.accelScale,
        z: sensorData.imu.accel.z * state.accelScale
    };

    const scaledGyro: Vector3 = {
        x: sensorData.imu.gyro.x * state.gyroScale,
        y: sensorData.imu.gyro.y * state.gyroScale,
        z: sensorData.imu.gyro.z * state.gyroScale
    };

    // Apply low-pass filtering
    state.filteredAccel = applyLowPassFilter(scaledAccel, state.filteredAccel, state.lowPassAlpha);
    state.filteredGyro = applyLowPassFilter(scaledGyro, state.filteredGyro, state.lowPassAlpha);

    // Remove gravity bias
    const linearAccel = removeGravityBias(state.filteredAccel, state.orientation);

    // Update orientation
    state.orientation = updateOrientation(state.filteredGyro, state.orientation, dt);

    // Detect stationary state
    state.isStationary = detectStationary(state.filteredAccel, state.velocity, state);

    // If stationary, gradually reduce velocity to zero
    if (state.isStationary) {
        state.velocity = vectorScale(state.velocity, 0.95); // Damping factor
    } else {
        // Integrate acceleration to get velocity
        const deltaV = vectorScale(linearAccel, dt);
        state.velocity = vectorAdd(state.velocity, deltaV);
    }

    // Integrate velocity to get position
    const deltaP = vectorScale(state.velocity, dt);
    state.position = vectorAdd(state.position, deltaP);

    // Process GPS data if available
    let gpsPosition: Vector3 | null = null;
    let fusedPosition = state.position;

    if (sensorData.gps) {
        state.gpsAvailable = true;
        state.gpsFixQuality = sensorData.gps.sats || 0;

        // Convert GPS to local coordinates
        if (!state.lastGpsPosition) {
            // First GPS reading - set as reference
            state.lastGpsPosition = { x: 0, y: 0, z: sensorData.gps.alt || 0 };
            gpsPosition = state.lastGpsPosition;
        } else {
            // Convert current GPS to local position
            const referenceGps = {
                lat: 0, lon: 0, alt: state.lastGpsPosition.z, sats: 0
            };
            gpsPosition = gpsToLocalPosition(sensorData.gps, referenceGps);
        }

        // Calculate GPS velocity (if we have speed)
        if (sensorData.gps.speed !== undefined && sensorData.gps.heading !== undefined) {
            const headingRad = sensorData.gps.heading * Math.PI / 180;
            state.gpsVelocity = {
                x: sensorData.gps.speed * Math.cos(headingRad),
                y: sensorData.gps.speed * Math.sin(headingRad),
                z: 0
            };
        }

        // Fuse GPS with IMU position based on accuracy and confidence
        if (state.fusionEnabled && gpsPosition && sensorData.gps.accuracy) {
            const gpsWeight = Math.max(0.1, Math.min(0.9, 10.0 / sensorData.gps.accuracy));
            fusedPosition = vectorLerp(state.position, gpsPosition, gpsWeight);

            // Update confidence based on GPS accuracy
            state.positionConfidence = Math.min(1.0, state.positionConfidence + 0.1);
        }

        state.lastGpsPosition = gpsPosition;
    } else {
        state.gpsAvailable = false;
        // Decrease confidence when GPS is not available
        state.positionConfidence = Math.max(0.1, state.positionConfidence - 0.05);
    }

    return {
        velocity: state.velocity,
        position: state.position,
        orientation: state.orientation,
        isStationary: state.isStationary,
        gpsPosition,
        gpsVelocity: state.gpsVelocity,
        gpsAvailable: state.gpsAvailable,
        fusedPosition
    };
}

/**
 * Legacy integration function (for backward compatibility)
 */
export function integrateMotion(accel: Vector3, dt: number, state: MotionState): { velocity: Vector3; position: Vector3 } {
    // Simple double integration
    const deltaV = vectorScale(accel, dt);
    state.velocity = vectorAdd(state.velocity, deltaV);

    const deltaP = vectorScale(state.velocity, dt);
    state.position = vectorAdd(state.position, deltaP);

    return {
        velocity: state.velocity,
        position: state.position
    };
}
