import * as coreAlarms from '@proton/pass/utils/time/alarm';
import { MINUTE } from '@proton/shared/lib/constants';

import browser, { clearBrowserMocks } from '../../__mocks__/webextension-polyfill';
import * as extensionAlarms from './alarm';

const { createExtensionAlarm, setupBrowserAlarm } = extensionAlarms;

const TEST_ALARM_NAME = 'test-alarm';

vi.mock('@proton/pass/utils/time/alarm', async () => ({
    __esModule: true,
    ...(await vi.importActual('@proton/pass/utils/time/alarm')),
}));

describe('Alarm utilities', () => {
    const onAlarm = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        onAlarm.mockClear();
        clearBrowserMocks();
    });

    describe('setupBrowserAlarm', () => {
        test('should register alarm listener on creation', () => {
            setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
        });

        test('should only trigger callback when alarm name matches', () => {
            setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            expect(browser.alarms.onAlarm.addListener).toHaveBeenCalledWith(expect.any(Function));

            const listener = browser.alarms.onAlarm.addListener.mock.calls[0][0];

            listener({ name: TEST_ALARM_NAME });
            listener({ name: 'other-alarm' });

            expect(onAlarm).toHaveBeenCalledTimes(1);
        });

        test('should create browser alarm when set is called', async () => {
            const alarm = setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            const when = 2_000_000;
            await alarm.set(when);

            expect(browser.alarms.create).toHaveBeenCalledWith(TEST_ALARM_NAME, { when });
        });

        test('should clear alarm when reset is called', async () => {
            const alarm = setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            await alarm.reset();

            expect(browser.alarms.clear).toHaveBeenCalledWith(TEST_ALARM_NAME);
        });

        test('should handle errors when clearing alarm', async () => {
            const alarm = setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            browser.alarms.clear.mockRejectedValueOnce(new Error('Clear failed'));

            await expect(alarm.reset()).resolves.toBe(false);
        });

        test('should return `scheduledTime` when exists', async () => {
            const alarm = setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            const scheduledTime = 2_000_000;
            browser.alarms.get.mockResolvedValueOnce({ scheduledTime });
            const result = await alarm.when();

            expect(browser.alarms.get).toHaveBeenCalledWith(TEST_ALARM_NAME);
            expect(result).toBe(scheduledTime);
        });

        test('should return `undefined` when no alarm exists', async () => {
            const alarm = setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            browser.alarms.get.mockResolvedValueOnce(undefined);

            const result = await alarm.when();

            expect(result).toBeUndefined();
        });

        test('should handle errors when getting alarm info', async () => {
            const alarm = setupBrowserAlarm(TEST_ALARM_NAME, onAlarm);
            browser.alarms.get.mockRejectedValueOnce(new Error('Get failed'));

            const result = await alarm.when();
            expect(result).toBeUndefined();
        });
    });

    describe('createExtensionAlarm', () => {
        const createTimeoutAlarm = vi.spyOn(coreAlarms, 'createTimeoutAlarm');
        const getTimeoutAlarm = () => createTimeoutAlarm.mock.results[0].value;

        afterEach(() => {
            createTimeoutAlarm.mockClear();
        });

        test('should create timeout and browser alarms on creation', () => {
            createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            expect(createTimeoutAlarm).toHaveBeenCalledWith(TEST_ALARM_NAME, onAlarm);
            expect(browser.alarms.onAlarm.addListener).toHaveBeenCalledWith(expect.any(Function));
        });

        test('should use timeout alarm for delays under 1 minute', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const timeoutAlarmSet = vi.spyOn(timeoutAlarm, 'set');
            const when = Date.now() + MINUTE - 1;

            await alarm.set(when);
            expect(timeoutAlarmSet).toHaveBeenCalledWith(when);
            expect(browser.alarms.create).not.toHaveBeenCalled();
        });

        test('should use browser alarm for delays of 1 minute or more', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const timeoutAlarmSet = vi.spyOn(timeoutAlarm, 'set');
            const when = Date.now() + MINUTE + 1;

            await alarm.set(when);
            expect(timeoutAlarmSet).not.toHaveBeenCalledWith();
            expect(browser.alarms.create).toHaveBeenCalledWith(TEST_ALARM_NAME, { when });
        });

        test('should reset both alarms when reset is called', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const timeoutAlarmReset = vi.spyOn(timeoutAlarm, 'reset');

            await alarm.reset();
            expect(timeoutAlarmReset).toHaveBeenCalledWith();
            expect(browser.alarms.clear).toHaveBeenCalledWith(TEST_ALARM_NAME);
        });

        test('should reset both alarms before setting new alarm', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const timeoutAlarmReset = vi.spyOn(timeoutAlarm, 'reset');

            await alarm.set(Date.now() + MINUTE);
            expect(timeoutAlarmReset).toHaveBeenCalled();
            expect(browser.alarms.clear).toHaveBeenCalledWith(TEST_ALARM_NAME);
        });

        test('should return timeout alarm time when available', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const when = Date.now() + (MINUTE - 1000);

            vi.spyOn(timeoutAlarm, 'when').mockResolvedValue(when);

            const result = await alarm.when();
            expect(result).toBe(when);
        });

        test('should return browser alarm time when timeout alarm returns `undefined`', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const scheduledTime = Date.now() + MINUTE + 1;

            vi.spyOn(timeoutAlarm, 'when').mockResolvedValue(undefined);
            browser.alarms.get.mockResolvedValue({ scheduledTime });

            const result = await alarm.when();
            expect(result).toBe(scheduledTime);
        });

        test('should return `undefined` when both alarms return `undefined`', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();

            vi.spyOn(timeoutAlarm, 'when').mockResolvedValue(undefined);
            browser.alarms.get.mockResolvedValue(undefined);
            const result = await alarm.when();

            expect(result).toBeUndefined();
        });

        test('should handle errors during reset gracefully', async () => {
            const alarm = createExtensionAlarm(TEST_ALARM_NAME, onAlarm);
            const timeoutAlarm = getTimeoutAlarm();
            const timeoutAlarmReset = vi.spyOn(timeoutAlarm, 'reset');

            browser.alarms.clear.mockRejectedValueOnce(new Error());

            await expect(alarm.reset()).resolves.toBe(false);
            expect(timeoutAlarmReset).toHaveBeenCalled();
        });
    });
});
