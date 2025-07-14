// Motion Integration and Sensor Fusion Module
// Handles advanced IMU data processing, orientation estimation, and motion integration

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

export interface MotionState {
    position: Vector3;
    velocity: Vector3;
    orientation: Quaternion;
    lastTimestamp: number;
    isInitialized: boolean;

    // Filter states
    accelFilter: LowPassFilter;
    gyroFilter: LowPassFilter;
    velocityHistory: Vector3[];
    accelHistory: Vector3[];  // Add acceleration history for outlier detection

    // ZUPT state
    zuptThreshold: number;
    zuptCounter: number;
    zuptRequiredFrames: number;

    // Madgwick filter state
    madgwick: MadgwickFilter;

    // IMU calibration
    accelScale: number;
    gyroScale: number;
    scaleDetected: boolean;

    // Debug settings
    enableOutlierDetection: boolean;
}

// Low-pass filter for noise reduction
class LowPassFilter {
    private alpha: number;
    private filteredValue: Vector3;
    private isInitialized: boolean = false;

    constructor(cutoffFreq: number, sampleRate: number) {
        // Calculate alpha from cutoff frequency
        const rc = 1.0 / (2.0 * Math.PI * cutoffFreq);
        const dt = 1.0 / sampleRate;
        this.alpha = dt / (rc + dt);
        this.filteredValue = { x: 0, y: 0, z: 0 };
    }

    filter(input: Vector3): Vector3 {
        if (!this.isInitialized) {
            this.filteredValue = { ...input };
            this.isInitialized = true;
            return this.filteredValue;
        }

        this.filteredValue.x = this.alpha * input.x + (1 - this.alpha) * this.filteredValue.x;
        this.filteredValue.y = this.alpha * input.y + (1 - this.alpha) * this.filteredValue.y;
        this.filteredValue.z = this.alpha * input.z + (1 - this.alpha) * this.filteredValue.z;

        return { ...this.filteredValue };
    }

    reset() {
        this.isInitialized = false;
        this.filteredValue = { x: 0, y: 0, z: 0 };
    }
}

// Madgwick AHRS filter for orientation estimation
class MadgwickFilter {
    private q: Quaternion = { w: 1, x: 0, y: 0, z: 0 };
    private beta: number;
    private sampleRate: number;

    constructor(beta: number = 0.1, sampleRate: number = 100) {
        this.beta = beta;
        this.sampleRate = sampleRate;
    }

    update(accel: Vector3, gyro: Vector3): Quaternion {
        const dt = 1.0 / this.sampleRate;

        // Normalize accelerometer measurement
        const accelNorm = this.normalize(accel);
        if (!accelNorm) return this.q;

        // Extract the gravity vector from quaternion
        const qw = this.q.w, qx = this.q.x, qy = this.q.y, qz = this.q.z;
        const gx = 2 * (qx * qz - qw * qy);
        const gy = 2 * (qw * qx + qy * qz);
        const gz = qw * qw - qx * qx - qy * qy + qz * qz;

        // Error is sum of cross product between estimated direction and measured direction
        const ex = (accelNorm.y * gz - accelNorm.z * gy);
        const ey = (accelNorm.z * gx - accelNorm.x * gz);
        const ez = (accelNorm.x * gy - accelNorm.y * gx);

        // Apply feedback terms
        const gx_feedback = gyro.x + this.beta * ex;
        const gy_feedback = gyro.y + this.beta * ey;
        const gz_feedback = gyro.z + this.beta * ez;

        // Integrate rate of change of quaternion
        const qDot_w = 0.5 * (-qx * gx_feedback - qy * gy_feedback - qz * gz_feedback);
        const qDot_x = 0.5 * (qw * gx_feedback + qy * gz_feedback - qz * gy_feedback);
        const qDot_y = 0.5 * (qw * gy_feedback - qx * gz_feedback + qz * gx_feedback);
        const qDot_z = 0.5 * (qw * gz_feedback + qx * gy_feedback - qy * gx_feedback);

        // Integrate to yield quaternion
        this.q.w += qDot_w * dt;
        this.q.x += qDot_x * dt;
        this.q.y += qDot_y * dt;
        this.q.z += qDot_z * dt;

        // Normalize quaternion
        this.q = this.normalizeQuaternion(this.q);

        return { ...this.q };
    }

    private normalize(v: Vector3): Vector3 | null {
        const norm = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (norm < 1e-6) return null;
        return { x: v.x / norm, y: v.y / norm, z: v.z / norm };
    }

    private normalizeQuaternion(q: Quaternion): Quaternion {
        const norm = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
        return { w: q.w / norm, x: q.x / norm, y: q.y / norm, z: q.z / norm };
    }

    getOrientation(): Quaternion {
        return { ...this.q };
    }

    reset() {
        this.q = { w: 1, x: 0, y: 0, z: 0 };
    }
}

// Utility functions for vector operations
export const VectorUtils = {
    magnitude: (v: Vector3): number => {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    },

    normalize: (v: Vector3): Vector3 | null => {
        const mag = VectorUtils.magnitude(v);
        if (mag < 1e-6) return null;
        return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
    },

    subtract: (a: Vector3, b: Vector3): Vector3 => {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    },

    add: (a: Vector3, b: Vector3): Vector3 => {
        return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    },

    scale: (v: Vector3, scalar: number): Vector3 => {
        return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
    },

    clamp: (v: Vector3, min: number, max: number): Vector3 => {
        return {
            x: Math.max(min, Math.min(max, v.x)),
            y: Math.max(min, Math.min(max, v.y)),
            z: Math.max(min, Math.min(max, v.z))
        };
    }
};

// Quaternion utilities for orientation handling
export const QuaternionUtils = {
    // Rotate a vector by a quaternion
    rotateVector: (v: Vector3, q: Quaternion): Vector3 => {
        // v' = q * v * q^-1
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        const vx = v.x, vy = v.y, vz = v.z;

        // First part: q * v
        const t_w = -qx * vx - qy * vy - qz * vz;
        const t_x = qw * vx + qy * vz - qz * vy;
        const t_y = qw * vy + qz * vx - qx * vz;
        const t_z = qw * vz + qx * vy - qy * vx;

        // Second part: (q * v) * q^-1 = (q * v) * q_conjugate
        return {
            x: -t_w * -qx + t_x * qw + t_y * -qz - t_z * -qy,
            y: -t_w * -qy + t_y * qw + t_z * -qx - t_x * -qz,
            z: -t_w * -qz + t_z * qw + t_x * -qy - t_y * -qx
        };
    },

    // Get gravity vector in body frame
    getGravityVector: (q: Quaternion): Vector3 => {
        // Gravity is [0, 0, -g] in world frame, rotate to body frame
        const worldGravity: Vector3 = { x: 0, y: 0, z: -9.81 };
        // We want the inverse rotation (world to body), so use conjugate
        const qConj: Quaternion = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
        return QuaternionUtils.rotateVector(worldGravity, qConj);
    }
};

// Outlier detection and rejection
export function detectOutliers(newAccel: Vector3, history: Vector3[], windowSize: number = 15, threshold: number = 8.0, enableDetection: boolean = true): boolean {
    // Optionally disable outlier detection for debugging
    if (!enableDetection) return false;

    // Need minimum samples to establish baseline - be more lenient
    if (history.length < Math.max(5, windowSize / 3)) return false;

    // Calculate median of recent measurements
    const recentHistory = history.slice(-windowSize);
    const magnitudes = recentHistory.map(v => VectorUtils.magnitude(v));
    magnitudes.sort((a, b) => a - b);

    const median = magnitudes[Math.floor(magnitudes.length / 2)];
    const newMagnitude = VectorUtils.magnitude(newAccel);

    // Calculate MAD (Median Absolute Deviation)
    const mad = magnitudes.map(m => Math.abs(m - median));
    mad.sort((a, b) => a - b);
    const madValue = mad[Math.floor(mad.length / 2)];

    // Avoid division by zero - if MAD is too small, use standard deviation approach
    if (madValue < 0.1) {
        const mean = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
        const variance = magnitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / magnitudes.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev < 0.1) return false; // Very consistent data, no outliers

        const zScore = Math.abs(newMagnitude - mean) / stdDev;
        return zScore > threshold;
    }

    // Modified Z-score using MAD
    const modifiedZScore = Math.abs(newMagnitude - median) / (madValue * 1.4826); // 1.4826 is constant for normal distribution

    // More lenient for typical IMU data ranges (usually 0-20 m/s² range)
    // Only reject if both statistical AND absolute thresholds are exceeded
    return modifiedZScore > threshold && Math.abs(newMagnitude - median) > 50.0;
}

// Zero Velocity Update (ZUPT) detection
export function detectZeroVelocity(accel: Vector3, gyro: Vector3, velocity: Vector3): boolean {
    const accelMag = VectorUtils.magnitude(accel);
    const gyroMag = VectorUtils.magnitude(gyro);
    const velMag = VectorUtils.magnitude(velocity);

    // More aggressive thresholds for better ZUPT detection
    const accelThreshold = 1.5; // m/s² deviation from gravity (more lenient)
    const gyroThreshold = 0.2; // rad/s (more lenient)
    const velocityThreshold = 5.0; // m/s (much more lenient - if device seems still, trust it)

    const gravityMag = 9.81;
    const accelDeviation = Math.abs(accelMag - gravityMag);

    // Primary check: acceleration close to gravity (device at rest)
    const isAccelStationary = accelDeviation < accelThreshold;
    const isGyroStationary = gyroMag < gyroThreshold;

    // If acceleration and gyro suggest stationary, ignore velocity (it might be drifted)
    if (isAccelStationary && isGyroStationary) {
        return true;
    }

    // Secondary check: all parameters within thresholds
    return accelDeviation < accelThreshold &&
        gyroMag < gyroThreshold &&
        velMag < velocityThreshold;
}

// Initialize motion state
export function initializeMotionState(sampleRate: number = 100, enableOutlierDetection: boolean = false): MotionState {
    return {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        orientation: { w: 1, x: 0, y: 0, z: 0 },
        lastTimestamp: 0,
        isInitialized: false,

        // Initialize filters - optimized for rocket movement at 100 Hz
        accelFilter: new LowPassFilter(25, sampleRate), // 25 Hz cutoff - higher for rocket dynamics
        gyroFilter: new LowPassFilter(30, sampleRate),  // 30 Hz cutoff - higher for rotation tracking
        velocityHistory: [],
        accelHistory: [],

        // ZUPT parameters - optimized for 100 Hz (10ms intervals)
        zuptThreshold: 0.1,
        zuptCounter: 0,
        zuptRequiredFrames: 20, // 200ms at 100 Hz - more conservative for rocket

        // Madgwick filter - optimized for 100 Hz
        madgwick: new MadgwickFilter(0.05, sampleRate), // Lower beta for more stable orientation at high freq

        // IMU calibration - will be auto-detected
        accelScale: 9.81 / 16384, // Default to ±2g range
        gyroScale: Math.PI / (180 * 131.0), // Default to ±250°/s range
        scaleDetected: false,

        // Debug settings - disabled by default for now
        enableOutlierDetection
    };
}

// Main motion integration function with all improvements
export function integrateMotion(imuData: IMUData, state: MotionState): {
    position: Vector3;
    velocity: Vector3;
    orientation: Quaternion;
    isStationary: boolean;
} {
    if (!state.isInitialized) {
        state.lastTimestamp = imuData.timestamp;
        state.isInitialized = true;
        return {
            position: state.position,
            velocity: state.velocity,
            orientation: state.orientation,
            isStationary: false
        };
    }

    // Calculate time delta in seconds
    const deltaTime = (imuData.timestamp - state.lastTimestamp) / 1000.0;

    // Skip if time delta is invalid
    if (deltaTime > 1.0 || deltaTime <= 0) {
        console.log(`[Motion] Invalid deltaTime: ${deltaTime}s, skipping frame`);
        state.lastTimestamp = imuData.timestamp;
        return {
            position: state.position,
            velocity: state.velocity,
            orientation: state.orientation,
            isStationary: false
        };
    }

    // Log timing if significantly different from expected 10ms (100 Hz)
    const expectedDelta = 0.01; // 10ms
    if (Math.abs(deltaTime - expectedDelta) > 0.005) { // More than 5ms deviation
        console.log(`[Motion] Timing deviation: ${(deltaTime * 1000).toFixed(1)}ms (expected: 10ms)`);
    }

    // Auto-detect IMU scale on first few samples if not already detected
    if (!state.scaleDetected && state.accelHistory.length < 10) {
        const rawMag = VectorUtils.magnitude(imuData.accel);
        const detected = detectAccelRange(rawMag);
        state.accelScale = 9.81 / detected.scale;
        state.scaleDetected = true;
        console.log(`[Motion] Auto-detected accelerometer: ${detected.range} (${detected.scale} LSB/g)`);
        console.log(`[Motion] Scale factor: ${state.accelScale.toFixed(6)} m/s²/LSB`);
        console.log(`[Motion] Raw magnitude: ${rawMag.toFixed(0)} LSB → ${(rawMag * state.accelScale).toFixed(2)} m/s²`);

        // Verify conversion is reasonable (should be near gravity when stationary)
        const convertedMag = rawMag * state.accelScale;
        if (Math.abs(convertedMag - 9.81) > 2.0) {
            console.warn(`[Motion] WARNING: Converted magnitude ${convertedMag.toFixed(2)} m/s² seems incorrect (expected ~9.81 m/s²)`);
        }
    }

    // Convert raw IMU data to m/s² and rad/s using detected/configured scales
    const rawAccel: Vector3 = {
        x: imuData.accel.x * state.accelScale,
        y: imuData.accel.y * state.accelScale,
        z: imuData.accel.z * state.accelScale
    };

    const rawGyro: Vector3 = {
        x: imuData.gyro.x * state.gyroScale,
        y: imuData.gyro.y * state.gyroScale,
        z: imuData.gyro.z * state.gyroScale
    };

    // Debug: Log both raw and converted values occasionally
    const shouldLogDebug = state.accelHistory.length % 100 === 0; // Every 1 second at 100Hz
    if (shouldLogDebug) {
        const rawMag = VectorUtils.magnitude(imuData.accel);
        const convertedMag = VectorUtils.magnitude(rawAccel);
        const velMag = VectorUtils.magnitude(state.velocity);
        console.log(`[Motion] Raw accel magnitude: ${rawMag.toFixed(0)} LSB, Converted: ${convertedMag.toFixed(2)} m/s²`);
        console.log(`[Motion] Current velocity magnitude: ${velMag.toFixed(2)} m/s`);
        console.log(`[Motion] Current scales: Accel=${(9.81 / state.accelScale).toFixed(0)} LSB/g, Gyro=${(180 * state.gyroScale / Math.PI).toFixed(1)} LSB/°/s`);

        // Emergency velocity reset if values are unreasonable (device appears stationary but velocity is high)
        if (velMag > 30 && Math.abs(convertedMag - 9.81) < 2.0) {
            console.warn(`[Motion] EMERGENCY: Resetting velocity from ${velMag.toFixed(2)} m/s (device appears stationary)`);
            state.velocity = { x: 0, y: 0, z: 0 };
        }
    }

    // Update acceleration history for outlier detection
    state.accelHistory.push({ ...rawAccel });
    const MAX_ACCEL_HISTORY = 30; // 300ms at 100 Hz
    if (state.accelHistory.length > MAX_ACCEL_HISTORY) {
        state.accelHistory.shift();
    }

    // Outlier detection and rejection (currently disabled for debugging)
    const OUTLIER_WINDOW_SIZE = 20; // 200ms at 100 Hz for better statistical reliability
    const isOutlier = detectOutliers(rawAccel, state.accelHistory, OUTLIER_WINDOW_SIZE, 8.0, state.enableOutlierDetection);
    if (isOutlier) {
        const accelMag = VectorUtils.magnitude(rawAccel);
        console.log('[Motion] Outlier detected, skipping frame.');
        console.log('[Motion] Accel magnitude:', accelMag.toFixed(2), 'History size:', state.accelHistory.length);

        // Still update timestamp to prevent time delta issues
        state.lastTimestamp = imuData.timestamp;
        return {
            position: state.position,
            velocity: state.velocity,
            orientation: state.orientation,
            isStationary: false
        };
    }

    // Apply low-pass filtering to reduce noise
    const filteredAccel = state.accelFilter.filter(rawAccel);
    const filteredGyro = state.gyroFilter.filter(rawGyro);

    // Update orientation using Madgwick filter
    state.orientation = state.madgwick.update(filteredAccel, filteredGyro);

    // Remove gravity using estimated orientation
    const gravityInBody = QuaternionUtils.getGravityVector(state.orientation);
    const linearAccel = VectorUtils.subtract(filteredAccel, gravityInBody);

    // Zero Velocity Update (ZUPT) detection
    const isStationary = detectZeroVelocity(filteredAccel, filteredGyro, state.velocity);

    if (isStationary) {
        state.zuptCounter++;
        if (state.zuptCounter >= state.zuptRequiredFrames) {
            // Apply ZUPT - reset velocity and clamp small movements
            const oldVelMag = VectorUtils.magnitude(state.velocity);
            state.velocity = { x: 0, y: 0, z: 0 };
            if (oldVelMag > 0.1) {
                console.log(`[Motion] ZUPT applied - velocity reset from ${oldVelMag.toFixed(2)} m/s to 0`);
            }
            state.zuptCounter = 0;
        }
    } else {
        state.zuptCounter = 0;
    }

    // Debug ZUPT status
    if (shouldLogDebug) {
        console.log(`[Motion] ZUPT status: ${isStationary ? 'stationary' : 'moving'}, counter: ${state.zuptCounter}/${state.zuptRequiredFrames}`);
    }

    // Integrate acceleration to velocity if not in ZUPT mode
    if (!isStationary || state.zuptCounter < state.zuptRequiredFrames) {
        state.velocity.x += linearAccel.x * deltaTime;
        state.velocity.y += linearAccel.y * deltaTime;
        state.velocity.z += linearAccel.z * deltaTime;

        // Apply velocity deadband to prevent drift
        const deadband = 0.02; // m/s
        if (Math.abs(state.velocity.x) < deadband) state.velocity.x = 0;
        if (Math.abs(state.velocity.y) < deadband) state.velocity.y = 0;
        if (Math.abs(state.velocity.z) < deadband) state.velocity.z = 0;

        // Clamp velocity to reasonable limits (more conservative for debugging)
        const maxVelocity = 100; // Increased limit but still reasonable for rocket
        state.velocity = VectorUtils.clamp(state.velocity, -maxVelocity, maxVelocity);

        // Debug: Log when clamping occurs
        const velMag = VectorUtils.magnitude(state.velocity);
        if (velMag >= maxVelocity * 0.9) { // Log when approaching limit
            console.log(`[Motion] Velocity approaching limit: ${velMag.toFixed(2)} m/s (limit: ${maxVelocity})`);
        }
    }

    // Integrate velocity to position
    state.position.x += state.velocity.x * deltaTime + 0.5 * linearAccel.x * deltaTime * deltaTime;
    state.position.y += state.velocity.y * deltaTime + 0.5 * linearAccel.y * deltaTime * deltaTime;
    state.position.z += state.velocity.z * deltaTime + 0.5 * linearAccel.z * deltaTime * deltaTime;

    // Prevent negative altitude (assuming Z is up)
    if (state.position.z < 0) {
        state.position.z = 0;
        if (state.velocity.z < 0) state.velocity.z = 0;
    }

    // Update velocity history for ZUPT and analysis
    state.velocityHistory.push({ ...state.velocity });
    const MAX_VELOCITY_HISTORY = 50; // 500ms at 100 Hz
    if (state.velocityHistory.length > MAX_VELOCITY_HISTORY) {
        state.velocityHistory.shift();
    }

    // Update timestamp
    state.lastTimestamp = imuData.timestamp;

    return {
        position: { ...state.position },
        velocity: { ...state.velocity },
        orientation: { ...state.orientation },
        isStationary: isStationary && state.zuptCounter >= state.zuptRequiredFrames
    };
}

// Reset motion state (for launch resets)
export function resetMotionState(state: MotionState): void {
    state.position = { x: 0, y: 0, z: 0 };
    state.velocity = { x: 0, y: 0, z: 0 };
    state.orientation = { w: 1, x: 0, y: 0, z: 0 };
    state.isInitialized = false;
    state.zuptCounter = 0;
    state.velocityHistory = [];
    state.accelHistory = [];

    // Reset filters
    state.accelFilter.reset();
    state.gyroFilter.reset();
    state.madgwick.reset();

    // Keep outlier detection setting as is
}

// Utility function to enable/disable outlier detection during runtime
export function setOutlierDetection(state: MotionState, enabled: boolean): void {
    state.enableOutlierDetection = enabled;
    console.log(`[Motion] Outlier detection ${enabled ? 'enabled' : 'disabled'}`);
}

// Utility function to get motion state summary for debugging
export function getMotionStateSummary(state: MotionState): string {
    const posMag = VectorUtils.magnitude(state.position);
    const velMag = VectorUtils.magnitude(state.velocity);
    const accelHistorySize = state.accelHistory.length;
    const velHistorySize = state.velocityHistory.length;

    return `Pos: ${posMag.toFixed(2)}m, Vel: ${velMag.toFixed(2)}m/s, ` +
        `ZUPT counter: ${state.zuptCounter}, Histories: A=${accelHistorySize}, V=${velHistorySize}`;
}

// MPU6050 scale factors for different ranges
export const MPU6050_SCALES = {
    ACCEL: {
        RANGE_2G: 16384,   // LSB/g for ±2g range
        RANGE_4G: 8192,    // LSB/g for ±4g range  
        RANGE_8G: 4096,    // LSB/g for ±8g range
        RANGE_16G: 2048    // LSB/g for ±16g range
    },
    GYRO: {
        RANGE_250: 131.0,  // LSB/°/s for ±250°/s range
        RANGE_500: 65.5,   // LSB/°/s for ±500°/s range
        RANGE_1000: 32.8,  // LSB/°/s for ±1000°/s range
        RANGE_2000: 16.4   // LSB/°/s for ±2000°/s range
    }
};

// Detect MPU6050 accelerometer range based on stationary readings
export function detectAccelRange(rawAccelMagnitude: number): { range: string, scale: number } {
    // Calculate differences for each range
    const ranges = [
        { name: '±2g', expected: MPU6050_SCALES.ACCEL.RANGE_2G, scale: MPU6050_SCALES.ACCEL.RANGE_2G },
        { name: '±4g', expected: MPU6050_SCALES.ACCEL.RANGE_4G, scale: MPU6050_SCALES.ACCEL.RANGE_4G },
        { name: '±8g', expected: MPU6050_SCALES.ACCEL.RANGE_8G, scale: MPU6050_SCALES.ACCEL.RANGE_8G },
        { name: '±16g', expected: MPU6050_SCALES.ACCEL.RANGE_16G, scale: MPU6050_SCALES.ACCEL.RANGE_16G }
    ];

    // Find closest match
    let bestMatch = ranges[0];
    let minDiff = Math.abs(rawAccelMagnitude - bestMatch.expected);

    for (const range of ranges) {
        const diff = Math.abs(rawAccelMagnitude - range.expected);
        if (diff < minDiff) {
            minDiff = diff;
            bestMatch = range;
        }
    }

    return { range: bestMatch.name, scale: bestMatch.scale };
}

// Convert raw IMU values to physical units
export function convertIMUData(rawAccel: Vector3, rawGyro: Vector3, accelScale?: number, gyroScale?: number): {
    accel: Vector3;
    gyro: Vector3;
    accelScale: number;
    gyroScale: number;
} {
    // Auto-detect scale if not provided
    if (!accelScale) {
        const rawMag = VectorUtils.magnitude(rawAccel);
        const detected = detectAccelRange(rawMag);
        accelScale = 9.81 / detected.scale;
        console.log(`[Motion] Auto-detected accelerometer range: ${detected.range} (scale: ${detected.scale} LSB/g)`);
    }

    if (!gyroScale) {
        gyroScale = Math.PI / (180 * MPU6050_SCALES.GYRO.RANGE_250); // Default to ±250°/s
    }

    return {
        accel: {
            x: rawAccel.x * accelScale,
            y: rawAccel.y * accelScale,
            z: rawAccel.z * accelScale
        },
        gyro: {
            x: rawGyro.x * gyroScale,
            y: rawGyro.y * gyroScale,
            z: rawGyro.z * gyroScale
        },
        accelScale,
        gyroScale
    };
} 