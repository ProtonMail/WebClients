import { put, takeLeading } from 'redux-saga/effects';

import { offlineResume, startEventPolling } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import identity from '@proton/utils/identity';

import { hydrate } from './hydrate.saga';

function* offlineResumeWorker(options: RootSagaOptions, { payload, meta }: ReturnType<typeof offlineResume.intent>) {
    const auth = options.getAuthService();
    const requestId = meta.request.id;
    const { localID } = payload;

    try {
        if ((yield auth.resumeSession(localID, { retryable: false })) as boolean) {
            /** Network errors during hydration (getUserData, getOrganization) are handled
             * gracefully with cached fallbacks. Any errors escaping from hydration are true
             * terminal failures which should soft logout to clear the corrupted state. */
            yield hydrate(
                {
                    online: true,
                    merge: identity,
                    onError: function* () {
                        yield auth.logout({ soft: true });
                    },
                },
                options
            );
            yield put(startEventPolling());
            yield put(offlineResume.success(requestId));
        } else throw new Error();
    } catch (err) {
        yield put(offlineResume.failure(requestId, err));
    }
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineResume.intent.match, offlineResumeWorker, options);
}
