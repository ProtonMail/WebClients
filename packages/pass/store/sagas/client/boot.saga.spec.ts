import { runSaga } from 'redux-saga';

import * as API from '../../../lib/api/api';
import { AppStatus } from '../../../types';
import { bootFailure, bootIntent, cacheConflict, itemsUpdated, stateDestroy } from '../../actions';
import type { RootSagaOptions } from '../../types';
import { sagaSetup } from '../testing';
import watcher from './boot.saga';
import * as hydrateSaga from './hydrate.saga';

const setResumeLock = jest.fn();
const setAppStatus = jest.fn();
const onBoot = jest.fn();

const options = {
    getSettings: () => Promise.resolve({}),
    getAuthStore: () => ({ getUserID: () => 'user-id' }),
    setAppStatus,
    onBoot,
} as unknown as RootSagaOptions;

(API as any).api = { setResumeLock };

describe('Boot saga', () => {
    describe('Resume lock', () => {
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

    describe('Cancellation', () => {
        beforeEach(() => {
            setAppStatus.mockClear();
            onBoot.mockClear();

            jest.spyOn(hydrateSaga, 'hydrate').mockImplementation(function* () {
                /** Stall `hydrate` so the boot is suspended mid-hydration:
                 * the exact window a cross-tab `cacheConflict` targets, leaving
                 * only the watcher's race able to resolve the boot. */
                yield new Promise(() => {});
            } as any);
        });

        const startBoot = async () => {
            const saga = sagaSetup();
            const task = runSaga(saga.options, watcher, options);
            saga.options.dispatch(bootIntent({}));
            await saga.nextTick();
            return { saga, task };
        };

        test('a local caching action during boot does not cancel the boot', async () => {
            const { saga, task } = await startBoot();
            saga.options.dispatch(itemsUpdated([]));
            await saga.nextTick();

            expect(setAppStatus).not.toHaveBeenCalledWith(AppStatus.ERROR);
            task.cancel();
            await task.toPromise();
        });

        test('`cacheConflict` (another tab cached mid-boot) cancels the boot', async () => {
            const { saga, task } = await startBoot();
            saga.options.dispatch(cacheConflict());
            await saga.nextTick();

            expect(setAppStatus).toHaveBeenCalledWith(AppStatus.ERROR);
            task.cancel();
            await task.toPromise();
        });

        test('`stateDestroy` cancels the boot', async () => {
            const { saga, task } = await startBoot();
            saga.options.dispatch(stateDestroy());
            await saga.nextTick();

            expect(setAppStatus).toHaveBeenCalledWith(AppStatus.ERROR);
            task.cancel();
            await task.toPromise();
        });
    });
});
