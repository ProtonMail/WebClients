import type { Saga } from 'redux-saga';
import { runSaga, stdChannel } from 'redux-saga';

import type { Credentials, MasterKeyState } from '../../types';
import { addMasterKey, masterKeyFailed } from '../slices/core/credentials';
import { waitForMasterKey } from './masterKey';

/**
 * Drives `waitForMasterKey` against a real saga runtime rather than asserting on yielded effects,
 * because what is being tested is scheduling behaviour — does it park, does it wake — and an
 * effect-shape assertion would pass even if the select/take ordering were wrong.
 */
const run = (initial: MasterKeyState) => {
    const channel = stdChannel<any>();
    let credentials: Credentials = { masterKeyState: initial };

    const task = runSaga(
        {
            channel,
            dispatch: (action: any) => {
                // Mirror the reducer closely enough for the re-read after the race to see the key.
                if (addMasterKey.match(action)) {
                    credentials = { masterKeyState: { status: 'ready', masterKey: action.payload } };
                }
                if (masterKeyFailed.match(action)) {
                    credentials = { masterKeyState: { status: 'failed', message: action.payload } };
                }
                channel.put(action);
                return action;
            },
            getState: () => ({ credentials }) as any,
            // The rejection cases are expected; keep redux-saga's own logger out of the output.
            onError: () => {},
        },
        waitForMasterKey as Saga,
        'test'
    );

    return {
        task,
        dispatch: (action: any) => channel.put(action),
        setState: (s: MasterKeyState) => {
            credentials = { masterKeyState: s };
        },
    };
};

describe('waitForMasterKey', () => {
    it('returns immediately when the key is already there', async () => {
        const { task } = run({ status: 'ready', masterKey: 'KEY' });
        await expect(task.toPromise()).resolves.toBe('KEY');
    });

    it('parks while loading, then resolves when addMasterKey lands', async () => {
        const { task, dispatch, setState } = run({ status: 'loading' });

        let settled = false;
        void task.toPromise().then(() => {
            settled = true;
        });
        await Promise.resolve();
        expect(settled).toBe(false);

        setState({ status: 'ready', masterKey: 'KEY' });
        dispatch(addMasterKey('KEY'));

        await expect(task.toPromise()).resolves.toBe('KEY');
    });

    it('wakes every parked task from a single addMasterKey', async () => {
        const channel = stdChannel<any>();
        let credentials: Credentials = { masterKeyState: { status: 'loading' } };
        const options = {
            channel,
            dispatch: (a: any) => a,
            getState: () => ({ credentials }) as any,
            onError: () => {},
        };

        const tasks = [1, 2, 3].map((i) => runSaga(options, waitForMasterKey as Saga, `task-${i}`));

        credentials = { masterKeyState: { status: 'ready', masterKey: 'KEY' } };
        channel.put(addMasterKey('KEY'));

        await expect(Promise.all(tasks.map((t) => t.toPromise()))).resolves.toEqual(['KEY', 'KEY', 'KEY']);
    });

    it('throws when the key load has already failed, without waiting', async () => {
        const { task } = run({ status: 'failed', message: 'network down' });
        await expect(task.toPromise()).rejects.toThrow('network down');
    });

    it('throws when masterKeyFailed arrives while parked', async () => {
        const { task, dispatch, setState } = run({ status: 'loading' });
        setState({ status: 'failed', message: 'boom' });
        dispatch(masterKeyFailed('boom'));
        await expect(task.toPromise()).rejects.toThrow('boom');
    });

    it('throws for an ineligible user rather than waiting forever', async () => {
        const { task } = run({ status: 'ineligible' });
        await expect(task.toPromise()).rejects.toThrow('not eligible');
    });
});
