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
        storage = { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() };
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
        it('should add an event to the buffer when enabled', async () => {
            storage.getItem.mockResolvedValue(null);
            const result = await dispatcher.push('evt_1');

            expect(result).toBe(true);
            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"events":["evt_1"]'));
        });

        it('should not add an event when disabled', async () => {
            getEnabled.mockReturnValue(false);
            const result = await dispatcher.push('evt_1');

            expect(result).toBe(false);
            expect(storage.setItem).not.toHaveBeenCalled();
        });

        it('should set an alarm if no alarm is currently set', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(undefined);
            await dispatcher.push('evt_1');

            expect(alarm.set).toHaveBeenCalled();
        });

        it('should set an alarm if no alarm is currently set', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(Date.now() + 30000);
            await dispatcher.push('evt_2');

            expect(alarm.set).not.toHaveBeenCalled();
        });

        it('should append to existing bundle if one exists', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            await dispatcher.push('evt_2');

            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"events":["evt_1","evt_2"]'));
        });

        it('should use prepare function if provided', async () => {
            storage.getItem.mockResolvedValue(null);
            prepare.mockImplementation((event) => event.toUpperCase());
            await dispatcher.push('evt_1');

            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"events":["EVT_1"]'));
        });
    });

    describe('start', () => {
        it('should set up an alarm if events are in the buffer', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(undefined);
            await dispatcher.start();

            expect(alarm.set).toHaveBeenCalled();
        });

        it('should not set up an alarm if the buffer is empty', async () => {
            storage.getItem.mockResolvedValue(null);
            await dispatcher.start();

            expect(alarm.set).not.toHaveBeenCalled();
        });

        it('should not set up an alarm if one is already set', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            alarm.when.mockResolvedValue(Date.now() + 30000);
            await dispatcher.start();

            expect(alarm.set).not.toHaveBeenCalled();
        });

        it('should stop the dispatcher if not enabled', async () => {
            getEnabled.mockReturnValue(false);
            alarm.when.mockResolvedValue(Date.now() + 30000);
            await dispatcher.start();

            expect(alarm.reset).toHaveBeenCalled();
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });
    });

    describe('stop', () => {
        it('should clear the alarm', () => {
            dispatcher.stop();
            expect(alarm.reset).toHaveBeenCalled();
        });

        it('should clear the buffer', () => {
            dispatcher.stop();
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });
    });

    describe('send', () => {
        it('should dispatch events when the send time has passed', async () => {
            storage.getItem.mockResolvedValue(pastBundle);
            dispatch.mockResolvedValue(undefined);
            await dispatcher.send();

            expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ events: ['evt_1'] }));
            expect(storage.removeItem).toHaveBeenCalledWith(key);
        });

        it('should not dispatch events when the send time has not passed', async () => {
            storage.getItem.mockResolvedValue(nonEmptyBundle);
            await dispatcher.send();

            expect(dispatch).not.toHaveBeenCalled();
            expect(storage.removeItem).not.toHaveBeenCalled();
        });

        it('should increase retry count on failed dispatch', async () => {
            storage.getItem.mockResolvedValue(pastBundle);
            dispatch.mockRejectedValue(new Error('Dispatch failed'));
            await dispatcher.send();

            expect(storage.setItem).toHaveBeenCalledWith(key, expect.stringContaining('"retryCount":1'));
        });

        it('should not retry after reaching max retries', async () => {
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
