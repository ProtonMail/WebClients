import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock } from '@proton/pass/lib/auth/session-lock';
import { generateCache } from '@proton/pass/lib/cache/generate';
import {
    sessionLockEnableFailure,
    sessionLockEnableIntent,
    sessionLockEnableSuccess,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import { selectHasRegisteredLock } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';

function* enableSessionLockWorker(
    { getAuthService, getAuthStore, setCache }: RootSagaOptions,
    { meta, payload: { pin, ttl } }: WithSenderAction<ReturnType<typeof sessionLockEnableIntent>>
) {
    try {
        /* if we're creating a new lock over an existing one delete the
         * previous one. This will happen during a lock TTL update. */
        if ((yield select(selectHasRegisteredLock)) as boolean) yield deleteSessionLock(pin);

        const state: State = yield select();

        /** Update the cache immediately after enavling the lock on the back-end.
         * In the web application, when a lock is created or updated, this change is
         * propagated to other active tabs. Therefore, we need to ensure that the cache is
         * refreshed and encrypted with the new sessionLockToken as soon as possible */
        const sessionLockToken: string = yield getAuthService().createLock(pin, ttl, {
            onLockCreated: async (sessionLockToken) => {
                try {
                    const authStore = getAuthStore();
                    const keyPassword = authStore.getPassword() ?? '';
                    const offlineKD = authStore.getOfflineKD();
                    const cache = await generateCache({ keyPassword, offlineKD, sessionLockToken })(state);
                    await setCache(cache);
                } catch {}
            },
        });

        yield put(sessionLockEnableSuccess(meta.request.id, { sessionLockToken, ttl }, meta.sender?.endpoint));
    } catch (error) {
        yield put(sessionLockEnableFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(sessionLockEnableIntent.match, enableSessionLockWorker, options);
}
