import type { Saga } from 'redux-saga';
import { runSaga, stdChannel } from 'redux-saga';

import type { Credentials, MasterKeyState, MasterKeysBundle } from '../../types';
import { addMasterKey, masterKeyFailed } from '../slices/core/credentials';
import { waitForMasterKey } from './masterKey';

const TEST_BUNDLE: MasterKeysBundle = {
    primaryMasterKeyId: 'test',
    primaryMasterKey: 'KEY',
    masterKeys: { test: 'KEY' },
};

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
                if (addMasterKey.match(action)) {
                    credentials = {
                        masterKeyState: {
                            status: 'ready',
                            primaryMasterKeyId: action.payload.primaryMasterKeyId,
                            primaryMasterKey: action.payload.primaryMasterKey,
                            masterKeys: action.payload.masterKeys,
                        },
                    };
                }
                if (masterKeyFailed.match(action)) {
                    const failure =
                        typeof action.payload === 'string'
                            ? { message: action.payload, reason: 'unknown' as const }
                            : action.payload;
                    credentials = { masterKeyState: { status: 'failed', ...failure } };
                }
                channel.put(action);
                return action;
            },
            getState: () => ({ credentials }) as any,
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
        const { task } = run({
            status: 'ready',
            primaryMasterKeyId: 'test',
            primaryMasterKey: 'KEY',
            masterKeys: { test: 'KEY' },
        });
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

        setState({
            status: 'ready',
            primaryMasterKeyId: 'test',
            primaryMasterKey: 'KEY',
            masterKeys: { test: 'KEY' },
        });
        dispatch(addMasterKey(TEST_BUNDLE));

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

        credentials = {
            masterKeyState: {
                status: 'ready',
                primaryMasterKeyId: 'test',
                primaryMasterKey: 'KEY',
                masterKeys: { test: 'KEY' },
            },
        };
        channel.put(addMasterKey(TEST_BUNDLE));

        await expect(Promise.all(tasks.map((t) => t.toPromise()))).resolves.toEqual(['KEY', 'KEY', 'KEY']);
    });

    it('throws when the key load has already failed, without waiting', async () => {
        const { task } = run({
            status: 'failed',
            message: 'network down',
            reason: 'unknown',
        });
        await expect(task.toPromise()).rejects.toThrow('network down');
    });

    it('throws when masterKeyFailed arrives while parked', async () => {
        const { task, dispatch, setState } = run({ status: 'loading' });
        setState({ status: 'failed', message: 'boom', reason: 'unknown' });
        dispatch(masterKeyFailed('boom'));
        await expect(task.toPromise()).rejects.toThrow('boom');
    });

    it('throws for an ineligible user rather than waiting forever', async () => {
        const { task } = run({ status: 'ineligible' });
        await expect(task.toPromise()).rejects.toThrow('not eligible');
    });
});
