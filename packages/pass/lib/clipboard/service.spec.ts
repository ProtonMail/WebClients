import { createClipboardService } from './service';
import type { ClipboardApi } from './types';

const AUTOCLEAR_MS = 5_000;

describe('createClipboardService', () => {
    let clipboard: jest.Mocked<ClipboardApi>;
    let alarmFactory: jest.MockedFunction<any>;
    let alarm: { set: jest.Mock; reset: jest.Mock; when: jest.Mock };

    beforeEach(() => {
        clipboard = { read: jest.fn(), write: jest.fn() };
        alarm = { set: jest.fn(), reset: jest.fn(), when: jest.fn() };
        alarmFactory = jest.fn().mockReturnValue(alarm);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('service creation', () => {
        test('should inherit clipboard methods', () => {
            const service = createClipboardService(clipboard, alarmFactory);
            expect(service.read).toBe(clipboard.read);
            expect(service.write).toBe(clipboard.write);
        });
    });

    describe('`autoClear` timeout handling', () => {
        test('should handle negative timeout values as no timeout', () => {
            const service = createClipboardService(clipboard, alarmFactory);
            service.autoClear(-1, 'clipboard-data');

            expect(alarm.reset).toHaveBeenCalledTimes(1);
            expect(alarm.set).not.toHaveBeenCalled();
            expect(clipboard.write).not.toHaveBeenCalled();
        });

        test('should set alarm with correct timeout when timeout is positive', () => {
            const service = createClipboardService(clipboard, alarmFactory);
            const now = Date.now();

            service.autoClear(AUTOCLEAR_MS, 'test');
            expect(alarm.reset).toHaveBeenCalledTimes(1);
            expect(alarm.set).toHaveBeenCalledWith(now + AUTOCLEAR_MS);
        });
    });

    describe('alarm callback behavior', () => {
        test('should clear clipboard when data matches stored value', async () => {
            clipboard.read.mockResolvedValue('test');
            clipboard.write.mockResolvedValue();

            const service = createClipboardService(clipboard, alarmFactory);
            service.autoClear(AUTOCLEAR_MS, 'test');

            const alarmCallback = alarmFactory.mock.calls[0][1];
            await alarmCallback();

            expect(clipboard.read).toHaveBeenCalledTimes(1);
            expect(clipboard.write).toHaveBeenCalledWith('');
        });

        test('should not clear clipboard when data does not match stored value', async () => {
            clipboard.read.mockResolvedValue(`${Math.random()}`);

            const service = createClipboardService(clipboard, alarmFactory);
            service.autoClear(AUTOCLEAR_MS, 'test');

            const alarmCallback = alarmFactory.mock.calls[0][1];
            await alarmCallback();

            expect(clipboard.read).toHaveBeenCalledTimes(1);
            expect(clipboard.write).not.toHaveBeenCalled();
        });

        test('should reset stored value after clearing clipboard', async () => {
            clipboard.read.mockResolvedValue('test');
            clipboard.write.mockResolvedValue();

            const service = createClipboardService(clipboard, alarmFactory);
            service.autoClear(AUTOCLEAR_MS, 'test');

            const alarmCallback = alarmFactory.mock.calls[0][1];
            await alarmCallback();
            expect(clipboard.write).toHaveBeenCalledTimes(1);
            clipboard.write.mockClear();

            /** Trigger alarm again to verify `clipboardValue` was reset to null.
             * Should not clear clipboard on second trigger */
            clipboard.read.mockResolvedValue('test');
            await alarmCallback();
            expect(clipboard.write).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        test('should handle clipboard read errors gracefully', async () => {
            clipboard.read.mockRejectedValue(new Error());

            const service = createClipboardService(clipboard, alarmFactory);
            service.autoClear(AUTOCLEAR_MS, 'test');

            const alarmCallback = alarmFactory.mock.calls[0][1];
            await expect(alarmCallback()).resolves.not.toThrow();

            expect(clipboard.write).not.toHaveBeenCalled();
        });

        test('should handle clipboard write errors gracefully', async () => {
            clipboard.read.mockResolvedValue('test');
            clipboard.write.mockRejectedValue(new Error());

            const service = createClipboardService(clipboard, alarmFactory);
            service.autoClear(AUTOCLEAR_MS, 'test');

            const alarmCallback = alarmFactory.mock.calls[0][1];
            await expect(alarmCallback()).resolves.not.toThrow();
        });
    });
});
