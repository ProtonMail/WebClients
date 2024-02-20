import { put, select, takeLeading } from 'redux-saga/effects';

import { generateCache } from '@proton/pass/lib/cache/generate';
import {
    sessionLockDisableFailure,
    sessionLockDisableIntent,
    sessionLockDisableSuccess,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import type { RootSagaOptions, State } from '@proton/pass/store/types';

function* disableSessionLockWorker(
    { getAuthService, getAuthStore, setCache }: RootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof sessionLockDisableIntent>>
) {
    try {
        const state = (yield select()) as State;

        /** Update the cache immediately after deleting the lock on the back-end.
         * In the web application, when a lock is deleted, this change is propagated
         * to other active tabs. Therefore, we need to ensure that the cache is
         * refreshed and encrypted without the sessionLockToken as soon as possible */
        yield getAuthService().deleteLock(payload.pin, {
            onLockDeleted: async () => {
                try {
                    const authStore = getAuthStore();
                    const keyPassword = authStore.getPassword() ?? '';
                    const offlineKD = authStore.getOfflineKD();
                    const cache = await generateCache({ keyPassword, offlineKD })(state);
                    await setCache(cache);
                } catch {}
            },
        });

        yield put(sessionLockDisableSuccess(meta.request.id, meta.sender?.endpoint));
    } catch (error) {
        yield put(sessionLockDisableFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(sessionLockDisableIntent.match, disableSessionLockWorker, options);
}
