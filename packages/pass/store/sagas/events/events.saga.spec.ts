import { runSaga } from 'redux-saga';

import { LockMode } from '../../../lib/auth/lock/types';
import { setSyncStrategy } from '../../../lib/sync/global';
import { SyncStrategy } from '../../../lib/sync/types';
import type { MaybeNull } from '../../../types';
import { lockCreateSuccess, startEventPolling, stopEventPolling } from '../../actions';
import { getOrganizationSettings } from '../../actions/creators/organization';
import type { RootSagaOptions } from '../../types';
import { sagaSetup } from '../testing';
import { coreChannel } from './core/channel.core';
import watcher, { getEventChannels } from './events.saga';
import { groupInvitesChannel } from './v1/channel.group-invites';
import { invitesChannel } from './v1/channel.invites';
import { shareChannels } from './v1/channel.share';
import { sharesChannel } from './v1/channel.shares';
import { userEventsChannel } from './v2/channel.user-events';

const lockCreated = lockCreateSuccess('req-lock', { mode: LockMode.PASSWORD, locked: false, ttl: 300 });
const orgEnforced = getOrganizationSettings.success('req-org', { Settings: {}, CanUpdate: false } as any);

type Gate = { lockMode: LockMode; forceLockSeconds: MaybeNull<number> };
const REQUIRED: Gate = { lockMode: LockMode.NONE, forceLockSeconds: 30 };
const NOT_REQUIRED: Gate = { lockMode: LockMode.NONE, forceLockSeconds: 0 };
const CONFIGURED: Gate = { lockMode: LockMode.PASSWORD, forceLockSeconds: 30 };
const NO_ORGANIZATION: Gate = { lockMode: LockMode.NONE, forceLockSeconds: null };

describe('Events saga', () => {
    describe('`getEventChannels`', () => {
        test('polls core + user-events channels under `SyncStrategy.USER_EVENTS`', () => {
            setSyncStrategy(SyncStrategy.USER_EVENTS);
            expect(getEventChannels().next().value).toEqual([coreChannel, userEventsChannel]);
        });

        test('polls V1 channels under `SyncStrategy.LEGACY`', () => {
            setSyncStrategy(SyncStrategy.LEGACY);
            const saga = getEventChannels();
            saga.next();
            expect(saga.next(false).value).toEqual([coreChannel, shareChannels, sharesChannel, invitesChannel]);
        });

        test('adds the group-invites channel when group invites are loaded', () => {
            setSyncStrategy(SyncStrategy.LEGACY);
            const saga = getEventChannels();
            saga.next();
            expect(saga.next(true).value).toEqual([coreChannel, shareChannels, sharesChannel, invitesChannel, groupInvitesChannel]);
        });
    });

    describe('watcher', () => {
        const polling = { active: 0 };

        function* worker(): Generator {
            polling.active += 1;
            try {
                yield new Promise(() => {});
            } finally {
                polling.active -= 1;
            }
        }

        const run = (initial: Gate) => {
            let gate = initial;

            const getState = () => ({
                settings: { lockMode: gate.lockMode },
                organization: gate.forceLockSeconds === null ? null : { settings: { ForceLockSeconds: gate.forceLockSeconds } },
            });

            const saga = sagaSetup();
            const task = runSaga({ ...saga.options, getState }, watcher, {} as RootSagaOptions, worker);

            return {
                setGate: (next: Gate) => (gate = next),
                stop: () => task.cancel(),
                dispatch: async (action: unknown) => {
                    saga.options.dispatch(action as any);
                    await saga.nextTick();
                },
            };
        };

        beforeEach(() => (polling.active = 0));

        test('does not start polling while lock setup is required', async () => {
            /** 1. Lock setup required -> `startEventPolling` stays gated */
            const { dispatch, stop } = run(REQUIRED);
            await dispatch(startEventPolling());
            expect(polling.active).toBe(0);
            stop();
        });

        test('starts polling when lock setup is not required', async () => {
            /** 1. No lock setup required -> polling starts */
            const { dispatch, stop } = run(NOT_REQUIRED);
            await dispatch(startEventPolling());
            expect(polling.active).toBe(1);
            stop();
        });

        test('does not gate polling for users without organization settings', async () => {
            /** 1. Non-b2b user has no organization settings -> lock setup is never required */
            const { dispatch, stop } = run(NO_ORGANIZATION);
            await dispatch(startEventPolling());
            expect(polling.active).toBe(1);
            stop();
        });

        test('resumes polling once lock setup completes', async () => {
            /** 1. Boot success requests polling -> gate blocks it */
            const { dispatch, setGate, stop } = run(REQUIRED);
            await dispatch(startEventPolling());
            expect(polling.active).toBe(0);

            /** 2. gate clears -> auto-resumes */
            setGate(CONFIGURED);
            await dispatch(lockCreated);
            expect(polling.active).toBe(1);
            stop();
        });

        test('pauses polling when the organization enforces lock setup mid-session', async () => {
            /** 1. Polling running while no lock setup is required */
            const { dispatch, setGate, stop } = run(NOT_REQUIRED);
            await dispatch(startEventPolling());
            expect(polling.active).toBe(1);

            /** 2. Admin forces lock setup -> polling pauses */
            setGate(REQUIRED);
            await dispatch(orgEnforced);
            expect(polling.active).toBe(0);
            stop();
        });

        test('does not resume after stop without a new polling request', async () => {
            /** 1. Polling started then stopped */
            const { dispatch, setGate, stop } = run(NOT_REQUIRED);
            await dispatch(startEventPolling());
            await dispatch(stopEventPolling());

            /** 2. gate change alone must not revive polling */
            setGate(CONFIGURED);
            await dispatch(lockCreated);
            expect(polling.active).toBe(0);
            stop();
        });

        test('does not fork a second worker when already polling', async () => {
            /** 1. Polling started */
            const { dispatch, stop } = run(NOT_REQUIRED);
            await dispatch(startEventPolling());

            /** 2. Second `startEventPolling` does not fork a duplicate worker */
            await dispatch(startEventPolling());
            expect(polling.active).toBe(1);
            stop();
        });
    });
});
