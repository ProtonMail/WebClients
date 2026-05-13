import { runSaga } from 'redux-saga';

import * as API from '@proton/pass/lib/api/api';
import { offlineResume } from '@proton/pass/store/actions';
import { sagaSetup } from '@proton/pass/store/sagas/testing';

import * as hydrateSaga from './hydrate.saga';
import watcher from './offline-resume.saga';

const setResumeLock = jest.fn();
(API as any).api = { setResumeLock };

jest.spyOn(hydrateSaga, 'hydrate').mockImplementation(function* () {
    return { fromCache: false, version: '0' };
});

describe('offline-resume saga', () => {
    const resumeSession = jest.fn();
    const options = { getAuthService: () => ({ resumeSession }) } as any;

    beforeEach(() => {
        setResumeLock.mockClear();
        resumeSession.mockReset();
    });

    test('should release the resume lock after successful `resumeSession`', async () => {
        resumeSession.mockResolvedValueOnce(true);
        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(offlineResume.intent({}));

        await saga.nextTick(); // session-resume success
        await saga.nextTick(); // state-hydrate
        expect(setResumeLock).toHaveBeenCalledWith(false);

        task.cancel();
        await task.toPromise();
    });

    test('should NOT release the resume lock when `resumeSession` fails', async () => {
        resumeSession.mockResolvedValueOnce(false);
        const saga = sagaSetup();
        const task = runSaga(saga.options, watcher, options);
        saga.options.dispatch(offlineResume.intent({}));

        await saga.nextTick(); // session-resume failure
        expect(setResumeLock).not.toHaveBeenCalled();

        task.cancel();
        await task.toPromise();
    });
});
