import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCpuPressureSignal } from './cpuPressureSignal';

vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isChromiumBased: () => true,
    isMobile: () => false,
}));

type PressureCallback = (records: { state: string }[]) => void;

let reportPressure: PressureCallback;

class FakePressureObserver {
    constructor(callback: PressureCallback) {
        reportPressure = callback;
    }

    observe = () => Promise.resolve();

    disconnect = () => {};
}

describe('createCpuPressureSignal', () => {
    beforeEach(() => {
        vi.stubGlobal('PressureObserver', FakePressureObserver);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        ['critical', 'critical'],
        ['serious', 'serious'],
        ['fair', 'relieved'],
        ['nominal', 'relieved'],
    ])('should report the %s pressure state as %s', (pressureState, level) => {
        const signal = createCpuPressureSignal();

        reportPressure([{ state: 'nominal' }, { state: pressureState }]);

        expect(signal.level()).toBe(level);
    });

    it('should report relief without the Compute Pressure API', () => {
        vi.stubGlobal('PressureObserver', undefined);

        expect(createCpuPressureSignal().level()).toBe('relieved');
    });
});
