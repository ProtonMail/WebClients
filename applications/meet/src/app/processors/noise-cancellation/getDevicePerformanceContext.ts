import { isLowEndDevice } from '../../utils/isLowEndDevice';

interface BatteryManager {
    charging: boolean;
    level: number;
}

type NavigatorWithDeviceHints = Navigator & {
    deviceMemory?: number;
    getBattery?: () => Promise<BatteryManager>;
};

type PerformanceWithMemory = Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
};

const BYTES_PER_MB = 1024 * 1024;

const getBatteryContext = async () => {
    try {
        const battery = await (navigator as NavigatorWithDeviceHints).getBattery?.();
        if (!battery) {
            return {};
        }
        return { batteryCharging: battery.charging, batteryLevel: Math.round(battery.level * 10) / 10 };
    } catch {
        return {};
    }
};

/**
 * Coarse hints about why a device may not keep up with real-time audio processing.
 * Several of these are Chromium only and come back undefined elsewhere.
 */
export const getDevicePerformanceContext = async (audioContext?: AudioContext) => {
    const { hardwareConcurrency, deviceMemory } = navigator as NavigatorWithDeviceHints;
    const memory = (performance as PerformanceWithMemory).memory;

    return {
        hardwareConcurrency,
        deviceMemoryGB: deviceMemory,
        isLowEndDevice: isLowEndDevice(),
        // Krisp moves audio through SharedArrayBuffers when available, and through postMessage otherwise.
        sharedArrayBufferAvailable: typeof SharedArrayBuffer !== 'undefined',
        // Browsers throttle hidden tabs, which starves the audio worker.
        visibilityState: document.visibilityState,
        jsHeapUsedMB: memory ? Math.round(memory.usedJSHeapSize / BYTES_PER_MB) : undefined,
        jsHeapLimitMB: memory ? Math.round(memory.jsHeapSizeLimit / BYTES_PER_MB) : undefined,
        audioContextState: audioContext?.state,
        audioContextSampleRate: audioContext?.sampleRate,
        audioContextBaseLatencyMs:
            audioContext?.baseLatency === undefined ? undefined : Math.round(audioContext.baseLatency * 1000),
        ...(await getBatteryContext()),
    };
};
