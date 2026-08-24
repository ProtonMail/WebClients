import { runSaga } from 'redux-saga';

import * as processor from '../../../../lib/sync/v2/user-events.processor';
import * as requests from '../../../../lib/sync/v2/user-events.requests';
import type { Api, MaybeNull, SyncEventListOutput } from '../../../../types';
import { setUserEventID } from '../../../actions';
import { forcePollV2 } from '../../../actions/creators/polling';
import type { RootSagaOptions } from '../../../types';
import { sagaReturn, sagaSetup } from '../../testing';
import { userEventsChannel } from './channel.user-events';

const getUserEventsSince = jest.spyOn(requests, 'getUserEventsSince');
const processUserEvents = jest.spyOn(processor, 'processUserEvents');

const createEvents = (data: Partial<SyncEventListOutput> = {}) =>
    ({
        LastEventID: 'event-2',
        EventsPending: false,
        FullRefresh: false,
        ...data,
    }) as SyncEventListOutput;

const options = { getPollingInterval: () => 60_000 } as RootSagaOptions;

const run = async (userEventId: MaybeNull<string> = 'event-1') => {
    const setup = sagaSetup({ user: { userEventId } });
    const task = runSaga(setup.options, userEventsChannel, {} as Api, options);
    await setup.nextTick();
    return { ...setup, task };
};

beforeEach(() => {
    jest.clearAllMocks();
    getUserEventsSince.mockResolvedValue(createEvents());
    processUserEvents.mockImplementation(sagaReturn(true));
});

describe('`userEventsChannel`', () => {
    test('polls since the latest `userEventID` and updates it once processed', async () => {
        const { dispatched, task } = await run();
        expect(getUserEventsSince).toHaveBeenCalledWith('event-1');
        expect(dispatched).toContainEqual(setUserEventID('event-2'));
        task.cancel();
    });

    test('does not update `userEventID` when processing fails', async () => {
        processUserEvents.mockImplementation(sagaReturn(false));
        const { dispatched, task } = await run();
        expect(dispatched).not.toContainEqual(setUserEventID('event-2'));
        task.cancel();
    });

    test('does not update `userEventID` on full refresh events [delegates to underlying `syncV2` call]', async () => {
        getUserEventsSince.mockResolvedValue(createEvents({ FullRefresh: true }));
        const { dispatched, task } = await run();
        expect(dispatched).not.toContainEqual(setUserEventID('event-2'));
        task.cancel();
    });

    test('skips polling without a `userEventID`', async () => {
        const { task } = await run(null);
        expect(getUserEventsSince).not.toHaveBeenCalled();
        task.cancel();
    });

    test('polls immediately while events are pending', async () => {
        getUserEventsSince.mockResolvedValueOnce(createEvents({ EventsPending: true }));
        const { nextTick, task } = await run();
        await nextTick();
        expect(getUserEventsSince).toHaveBeenCalledTimes(2);
        task.cancel();
    });

    test('`forcePollV2` short-circuits the poll delay', async () => {
        const { options: sagaOptions, nextTick, task } = await run();
        expect(getUserEventsSince).toHaveBeenCalledTimes(1);
        sagaOptions.dispatch(forcePollV2());
        await nextTick();
        expect(getUserEventsSince).toHaveBeenCalledTimes(2);
        task.cancel();
    });

    test('survives poll errors and keeps the channel alive', async () => {
        getUserEventsSince.mockRejectedValueOnce(new Error('network'));
        const { options: sagaOptions, dispatched, nextTick, task } = await run();
        sagaOptions.dispatch(forcePollV2());
        await nextTick();
        expect(dispatched).toContainEqual(setUserEventID('event-2'));
        task.cancel();
    });
});
