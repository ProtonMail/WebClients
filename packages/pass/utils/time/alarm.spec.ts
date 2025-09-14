import { createTimeoutAlarm } from './alarm';

const TEST_TIMEOUT_MS = 5000;
const TEST_ALARM_NAME = 'TEST_ALARM';

describe('createTimeoutAlarm', () => {
    const onAlarm = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        onAlarm.mockClear();
    });

    test('should create alarm with empty state', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        expect(alarm.when()).toBeUndefined();
    });

    test('should set alarm and return scheduled time', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        const when = Date.now() + TEST_TIMEOUT_MS;
        void alarm.set(when);

        expect(alarm.when()).toBe(when);
    });

    test('should trigger callback after timeout', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        const when = Date.now() + TEST_TIMEOUT_MS;
        void alarm.set(when);

        jest.advanceTimersByTime(TEST_TIMEOUT_MS);
        expect(onAlarm).toHaveBeenCalledTimes(1);
    });

    test('should not trigger callback before timeout', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        const when = Date.now() + TEST_TIMEOUT_MS;
        void alarm.set(when);

        jest.advanceTimersByTime(TEST_TIMEOUT_MS - 1);
        expect(onAlarm).not.toHaveBeenCalled();
    });

    test('should reset alarm and clear scheduled time', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        const when = Date.now() + TEST_TIMEOUT_MS;

        void alarm.set(when);
        void alarm.reset();

        expect(alarm.when()).toBeUndefined();

        jest.advanceTimersByTime(TEST_TIMEOUT_MS);
        expect(onAlarm).not.toHaveBeenCalled();
    });

    test('should replace existing alarm when set is called multiple times', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        const when1 = Date.now() + TEST_TIMEOUT_MS;
        const when2 = Date.now() + TEST_TIMEOUT_MS * 2;

        void alarm.set(when1);
        void alarm.set(when2);

        expect(alarm.when()).toBe(when2);

        jest.advanceTimersByTime(TEST_TIMEOUT_MS);
        expect(onAlarm).not.toHaveBeenCalled();

        jest.advanceTimersByTime(TEST_TIMEOUT_MS);
        expect(onAlarm).toHaveBeenCalledTimes(1);
    });

    test('should handle negative timeout gracefully', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        const when = Date.now() - 1000;
        void alarm.set(when);

        jest.advanceTimersByTime(0);
        expect(onAlarm).toHaveBeenCalledTimes(1);
    });

    test('should reset safely when no alarm is set', () => {
        const alarm = createTimeoutAlarm(TEST_ALARM_NAME, onAlarm);
        expect(() => alarm.reset()).not.toThrow();
    });
});
