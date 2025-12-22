import type { Rect } from '@proton/pass/types/utils/dom';

import { REFRESH_RATE, animatePositionChange } from './animation';

describe('animatePositionChange', () => {
    let get: jest.Mock;
    let set: jest.Mock;
    let onComplete: jest.Mock;
    let onAnimate: jest.Mock;
    let positions: Partial<Rect>[];
    let callCount: number;

    beforeEach(() => {
        jest.useFakeTimers();

        callCount = 0;
        positions = [];

        get = jest.fn(() => positions[Math.min(callCount++, positions.length - 1)]);
        set = jest.fn();
        onComplete = jest.fn();
        onAnimate = jest.fn((requestId) => requestId);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllTimers();
    });

    test('should complete when position stabilizes', () => {
        positions = [
            { top: 0, left: 0, right: 100, bottom: 100 },
            { top: 10, left: 10, right: 110, bottom: 110 },
            { top: 20, left: 20, right: 120, bottom: 120 },
            { top: 20, left: 20, right: 120, bottom: 120 },
            { top: 20, left: 20, right: 120, bottom: 120 },
        ];

        animatePositionChange({ get, set, onComplete, onAnimate });

        for (let i = 0; i < 4; i++) jest.advanceTimersByTime(REFRESH_RATE);

        expect(set).toHaveBeenCalledTimes(3);
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledTimes(4);
    });

    test('should respect threshold for sub-pixel changes', () => {
        positions = [
            { top: 0, left: 0, right: 100, bottom: 100 },
            { top: 0.05, left: 0.05, right: 100.05, bottom: 100.05 },
        ];

        animatePositionChange({ get, set, onComplete, onAnimate, threshold: 0.1 });
        for (let i = 0; i < 2; i++) jest.advanceTimersByTime(REFRESH_RATE);

        expect(set).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledTimes(2);
    });

    test('should force complete after maxDuration', () => {
        get.mockImplementation(() => ({ top: callCount++, left: 0, right: 100, bottom: 100 }));

        animatePositionChange({ get, set, onComplete, onAnimate, maxDuration: 200 });
        jest.advanceTimersByTime(250);

        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
