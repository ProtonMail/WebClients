import { isChromiumBased, isMobile } from '@proton/shared/lib/helpers/browser';

import type { CpuLoadLevel } from './cpuLoadStepper';

// The Compute Pressure API is not in TypeScript's DOM lib yet.
type PressureState = 'nominal' | 'fair' | 'serious' | 'critical';

interface PressureRecord {
    state: PressureState;
}

interface PressureObserverInstance {
    observe: (source: 'cpu', options?: { sampleInterval?: number }) => Promise<void>;
    disconnect: () => void;
}

type PressureObserverConstructor = new (callback: (records: PressureRecord[]) => void) => PressureObserverInstance;

const SAMPLE_INTERVAL_MS = 1000;

const LOAD_LEVEL_BY_PRESSURE_STATE: Record<PressureState, CpuLoadLevel> = {
    nominal: 'relieved',
    fair: 'relieved',
    serious: 'serious',
    critical: 'critical',
};

export const createCpuPressureSignal = () => {
    const { PressureObserver } = window as Window & { PressureObserver?: PressureObserverConstructor };
    if (!PressureObserver || !isChromiumBased() || isMobile()) {
        return { level: (): CpuLoadLevel => 'relieved', stop: () => {} };
    }

    let level: CpuLoadLevel = 'relieved';
    const observer = new PressureObserver((records) => {
        const latest = records[records.length - 1];
        level = latest ? LOAD_LEVEL_BY_PRESSURE_STATE[latest.state] : 'relieved';
    });
    // Rejects when a permissions policy blocks the source or the device cannot report it.
    observer.observe('cpu', { sampleInterval: SAMPLE_INTERVAL_MS }).catch(() => {
        level = 'relieved';
    });

    return {
        level: () => level,
        stop: () => observer.disconnect(),
    };
};
