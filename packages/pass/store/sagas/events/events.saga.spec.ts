import { runSaga } from 'redux-saga';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { lockCreateSuccess, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';

import watcher from './events.saga';

const lockCreated = lockCreateSuccess('req-lock', { mode: LockMode.PASSWORD, locked: false, ttl: 300 });
const orgEnforced = getOrganizationSettings.success('req-org', { Settings: {}, CanUpdate: false } as any);

type Gate = { lockMode: LockMode; forceLockSeconds: MaybeNull<number> };
const REQUIRED: Gate = { lockMode: LockMode.NONE, forceLockSeconds: 30 };
const NOT_REQUIRED: Gate = { lockMode: LockMode.NONE, forceLockSeconds: 0 };
const CONFIGURED: Gate = { lockMode: LockMode.PASSWORD, forceLockSeconds: 30 };
const NO_ORGANIZATION: Gate = { lockMode: LockMode.NONE, forceLockSeconds: null };

describe('events saga watcher', () => {
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
