import { runSaga } from 'redux-saga';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { lockCreateFailure, lockCreateIntent, lockCreateSuccess, stateDestroy } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import { last } from '@proton/pass/utils/fp/lens';

import watcher from './lock-create.saga';

describe('lock-create saga', () => {
    const authService = {
        checkLock: jest.fn().mockResolvedValue(undefined),
        createLock: jest.fn().mockResolvedValue(undefined),
        deleteLock: jest.fn().mockResolvedValue(undefined),
    };

    const authStore = { getLockMode: jest.fn().mockReturnValue(LockMode.NONE) };
    const options = { getAuthService: () => authService, getAuthStore: () => authStore } as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fail when state is destroyed during lock creation', async () => {
        const lock = { mode: LockMode.PASSWORD, secret: 'test-secret', ttl: 300 };
        const intent = lockCreateIntent(lock);
        const success = lockCreateSuccess(intent.meta.request.id, { mode: lock.mode, locked: false, ttl: lock.ttl });
        const failure = lockCreateFailure(intent.meta.request.id, LockMode.PASSWORD, new Error(), undefined);

        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);
        const asyncTask = task.toPromise();

        saga.options.dispatch(intent);
        saga.options.dispatch(stateDestroy());

        expect(last(saga.dispatched)).toEqual(failure);
        expect(saga.dispatched).not.toContainEqual(success);

        task.cancel();
        await asyncTask;
    });

    test('should fail when auth service throws an error', async () => {
        const lock = { mode: LockMode.PASSWORD, secret: 'test-secret', ttl: 300 };
        const intent = lockCreateIntent(lock);
        const failure = lockCreateFailure(intent.meta.request.id, LockMode.PASSWORD, new Error(), undefined);

        authService.checkLock.mockRejectedValueOnce(new Error());

        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);

        saga.options.dispatch(intent);
        await saga.nextTick();

        expect(last(saga.dispatched)).toEqual(failure);
        task.cancel();
    });

    test('should only process the first action when multiple are dispatched', async () => {
        let resolveCreateLock: () => void;
        authService.createLock.mockReturnValueOnce(new Promise<void>((resolve) => (resolveCreateLock = resolve)));

        const lock1 = { mode: LockMode.PASSWORD, secret: 'secret-1', ttl: 300 };
        const intent1 = lockCreateIntent(lock1);
        const success1 = lockCreateSuccess(intent1.meta.request.id, { mode: lock1.mode, locked: false, ttl: lock1.ttl });

        const lock2 = { mode: LockMode.PASSWORD, secret: 'secret-2', ttl: 600 };
        const intent2 = lockCreateIntent(lock2);
        const success2 = lockCreateSuccess(intent2.meta.request.id, { mode: lock2.mode, locked: false, ttl: lock2.ttl });

        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);

        /** 1. Dispatch first action (starts processing) */
        saga.options.dispatch(intent1);
        await saga.nextTick();

        /** 2. Dispatch second action while first is still in flight (should be ignored) */
        saga.options.dispatch(intent2);
        await saga.nextTick();

        /** 3. Complete the first action */
        resolveCreateLock!();
        await saga.nextTick();

        /** 4. Only the first action should have resulted in a success */
        expect(saga.dispatched).toContainEqual(success1);
        expect(saga.dispatched).not.toContainEqual(success2);
        expect(authService.createLock).toHaveBeenCalledTimes(1);
        expect(authService.checkLock).toHaveBeenCalledTimes(1);

        task.cancel();
    });
});
