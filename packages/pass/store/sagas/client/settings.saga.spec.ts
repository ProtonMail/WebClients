import { runSaga } from 'redux-saga';

import { updatePauseListItem } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { AppStatus } from '@proton/pass/types';

import watcher from './settings.saga';

describe('settings saga', () => {
    const onSettingsUpdated = jest.fn();
    const getAppState = jest.fn();
    const action = updatePauseListItem({ hostname: 'example.com', criteria: 'Autofill' });

    const state = { settings: {} };
    const options = { onSettingsUpdated, getAppState } as unknown as RootSagaOptions;

    beforeEach(() => jest.clearAllMocks());

    test('skips `onSettingsUpdated` when not booted and status is "post-state-destroyed"', async () => {
        getAppState.mockReturnValue({ booted: false, status: AppStatus.SESSION_LOCKED });
        const saga = sagaSetup(state);
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(action);
        await saga.nextTick();

        expect(onSettingsUpdated).not.toHaveBeenCalled();

        task.cancel();
        await task.toPromise();
    });

    test('skips `onSettingsUpdated` when not booted and status is UNAUTHORIZED', async () => {
        getAppState.mockReturnValue({ booted: false, status: AppStatus.UNAUTHORIZED });
        const saga = sagaSetup(state);
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(action);
        await saga.nextTick();

        expect(onSettingsUpdated).not.toHaveBeenCalled();

        task.cancel();
        await task.toPromise();
    });

    test('runs `onSettingsUpdated` when app is fully booted', async () => {
        getAppState.mockReturnValue({ booted: true, status: AppStatus.READY });
        const saga = sagaSetup(state);
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(action);
        await saga.nextTick();

        expect(onSettingsUpdated).toHaveBeenCalledTimes(1);

        task.cancel();
        await task.toPromise();
    });

    test('runs `onSettingsUpdated` during BOOTING status even if not booted', async () => {
        getAppState.mockReturnValue({ booted: false, status: AppStatus.BOOTING });
        const saga = sagaSetup(state);
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(action);
        await saga.nextTick();

        expect(onSettingsUpdated).toHaveBeenCalledTimes(1);

        task.cancel();
        await task.toPromise();
    });
});
