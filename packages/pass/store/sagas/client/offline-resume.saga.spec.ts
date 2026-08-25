import { runSaga } from 'redux-saga';

import { exposeApi } from '../../../lib/api/api';
import { offlineResume } from '../../actions';
import type { State } from '../../types';
import { sagaSetup } from '../testing';
import * as hydrateSaga from './hydrate.saga';
import watcher from './offline-resume.saga';

jest.mock('./hydrate.saga', () => ({
    ...jest.requireActual('./hydrate.saga'),
    hydrate: jest.fn(),
}));

const setResumeLock = jest.fn();
exposeApi({ setResumeLock } as any);

jest.mocked(hydrateSaga.hydrate).mockImplementation(function* () {
    return { fromCache: false, version: '0', state: {} as State };
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
