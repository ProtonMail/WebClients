import { runSaga } from 'redux-saga';

import * as API from '@proton/pass/lib/api/api';
import { bootFailure, bootIntent } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';

import watcher from './boot.saga';

const setResumeLock = jest.fn();
(API as any).api = { setResumeLock };

describe('boot saga — resume lock', () => {
    const options = { getSettings: () => new Promise(() => {}) } as any;
    beforeEach(() => setResumeLock.mockClear());

    test('`bootIntent({ offline: true })` should lock the api', async () => {
        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(bootIntent({ offline: true }));
        await saga.nextTick();

        expect(setResumeLock).toHaveBeenCalledWith(true);

        task.cancel();
        await task.toPromise();
    });

    test('`bootIntent({ offline: false })` should unlock the api', async () => {
        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(bootIntent({ offline: false }));
        await saga.nextTick();

        expect(setResumeLock).toHaveBeenCalledWith(false);

        task.cancel();
        await task.toPromise();
    });

    test('`bootFailure` should unlock the api', async () => {
        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(bootFailure(new Error()));
        await saga.nextTick();

        expect(setResumeLock).toHaveBeenCalledWith(false);

        task.cancel();
        await task.toPromise();
    });
});
