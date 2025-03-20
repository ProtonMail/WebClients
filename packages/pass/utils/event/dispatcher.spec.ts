import identity from '@proton/utils/identity';

import { msToEpoch } from '../time/epoch';
import { type EventDispatcher, type EventDispatcherOptions, createEventDispatcher } from './dispatcher';

const nonEmptyBundle = JSON.stringify({ sendTime: msToEpoch(Date.now() + 60_000), events: ['evt_1'], retryCount: 0 });
const pastBundle = JSON.stringify({ sendTime: msToEpoch(Date.now() - 1_000), events: ['evt_1'], retryCount: 0 });

describe('EventDispatcher', () => {
    let dispatcher: EventDispatcher<string>;
    let storage: { setItem: jest.Mock; getItem: jest.Mock; removeItem: jest.Mock };
    let options: EventDispatcherOptions<string, string>;
    let alarm: { set: jest.Mock; reset: jest.Mock; when: jest.Mock };
    let getEnabled: jest.Mock;
    let dispatch: jest.Mock;
    let getSendTime: jest.Mock;
    let prepare: jest.Mock;
    const key = 'test-key';

    beforeEach(() => {
        localStorage.clear();

        const getItem = jest.fn((key: string) => localStorage.getItem(key));
        const setItem = jest.fn((key: string, value: string) => localStorage.setItem(key, value));
        const removeItem = jest.fn((key: string) => localStorage.removeItem(key));

        storage = { setItem, getItem, removeItem };
        alarm = { set: jest.fn(), reset: jest.fn(), when: jest.fn() };
        getEnabled = jest.fn().mockReturnValue(true);
        dispatch = jest.fn().mockImplementation(async () => {});
        getSendTime = jest.fn().mockReturnValue(Date.now() + 60000);
        prepare = jest.fn().mockImplementation(identity);

        options = {
            id: 'test',
            alarm,
            maxRetries: 3,
            storage: storage as any,
            dispatch,
            getEnabled,
            getSendTime,
            getStorageKey: () => key,
            prepare,
        };

        dispatcher = createEventDispatcher(options);
    });

    describe('push', () => {
        test('should add an event to the buffer when enabled', async () => {
            const result = await dispatcher.push('evt_1');

            expect(result).toBe(true);
            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"events":["evt_1"]'));
        });

        test('should not add an event when disabled', async () => {
            getEnabled.mockReturnValue(false);
            const result = await dispatcher.push('evt_1');

            expect(result).toBe(false);
            expect(storage.setItem).not.toHaveBeenCalled();
        });

        test('should set an alarm if no alarm is currently set', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(undefined);
            await dispatcher.push('evt_1');

            expect(alarm.set).toHaveBeenCalled();
        });

        test('should set an alarm if no alarm is currently set', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(Date.now() + 30000);
            await dispatcher.push('evt_2');

            expect(alarm.set).not.toHaveBeenCalled();
        });

        test('should append to existing bundle if one exists', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            await dispatcher.push('evt_2');

            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"events":["evt_1","evt_2"]'));
        });

        test('should use prepare function if provided', async () => {
            storage.getItem.mockResolvedValue(null);
            prepare.mockImplementation((event) => event.toUpperCase());
            await dispatcher.push('evt_1');

            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"events":["EVT_1"]'));
        });

        test('should support concurrent push calls', async () => {
            await Promise.all([
                dispatcher.push('evt_1'),
                dispatcher.push('evt_2'),
                dispatcher.push('evt_3'),
                dispatcher.push('evt_4'),
            ]);

            const data = JSON.parse(storage.getItem(key));
            expect(storage.setItem).toHaveBeenCalledTimes(4);
            expect(data.events).toEqual(['evt_1', 'evt_2', 'evt_3', 'evt_4']);
        });
    });

    describe('start', () => {
        test('should set up an alarm if events are in the buffer', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(undefined);
            await dispatcher.start();

            expect(alarm.set).toHaveBeenCalled();
        });

        test('should not set up an alarm if the buffer is empty', async () => {
            storage.getItem.mockResolvedValue(null);
            await dispatcher.start();

            expect(alarm.set).not.toHaveBeenCalled();
        });

        test('should not set up an alarm if one is already set', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(Date.now() + 30000);
            await dispatcher.start();

            expect(alarm.set).not.toHaveBeenCalled();
        });

        test('should stop the dispatcher if not enabled', async () => {
            getEnabled.mockReturnValue(false);
            alarm.when.mockResolvedValue(Date.now() + 30000);
            await dispatcher.start();

            expect(alarm.reset).toHaveBeenCalled();
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });
    });

    describe('stop', () => {
        test('should clear the alarm', () => {
            dispatcher.stop();
            expect(alarm.reset).toHaveBeenCalled();
        });

        test('should clear the buffer', () => {
            dispatcher.stop();
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });
    });

    describe('send', () => {
        test('should dispatch events when the send time has passed', async () => {
            storage.getItem.mockResolvedValue(pastBundle);
            dispatch.mockResolvedValue(undefined);
            await dispatcher.send();

            expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ events: ['evt_1'] }));
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });

        test('should not dispatch events when the send time has not passed', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            await dispatcher.send();

            expect(dispatch).not.toHaveBeenCalled();
            expect(storage.removeItem).not.toHaveBeenCalled();
        });

        test('should increase retry count on failed dispatch', async () => {
            storage.getItem.mockResolvedValue(pastBundle);
            dispatch.mockRejectedValue(new Error('Dispatch failed'));
            await dispatcher.send();

            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"retryCount":1'));
        });

        test('should not retry after reaching max retries', async () => {
            const maxRetriesBundle = JSON.stringify({
                sendTime: msToEpoch(Date.now() - 1000),
                events: ['evt_1'],
                retryCount: 3,
            });

            storage.getItem.mockResolvedValue(maxRetriesBundle);
            await dispatcher.send();

            expect(dispatch).not.toHaveBeenCalled();
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });
    });
});
