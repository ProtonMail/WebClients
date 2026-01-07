import { put, takeLeading } from 'redux-saga/effects';

import { getInvalidPasswordString } from '@proton/pass/lib/auth/utils';
import { type OfflineComponents, getOfflineComponents } from '@proton/pass/lib/cache/crypto';
import { offlineToggle } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* offlineToggleWorker(
    { getAuthService, getAuthStore }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof offlineToggle.intent>
) {
    const auth = getAuthService();
    const authStore = getAuthStore();
    const requestId = meta.request.id;

    try {
        const verified: boolean = yield auth.confirmPassword(payload.loginPassword);
        if (!verified) throw new Error(getInvalidPasswordString(authStore));

        /** If the user does not have offline components setup on
         * the authentication store, generate the `offlineConfig`
         * `offlineKD` and persist the session immediately */
        if (payload.enabled && !authStore.hasOfflinePassword()) {
            const data: OfflineComponents = yield getOfflineComponents(payload.loginPassword);
            authStore.setOfflineConfig(data.offlineConfig);
            authStore.setOfflineKD(data.offlineKD);
            authStore.setOfflineVerifier(data.offlineVerifier);
            yield auth.persistSession();
        }

        yield put(offlineToggle.success(requestId, payload.enabled));
    } catch (error: unknown) {
        yield put(offlineToggle.failure(requestId, error, payload.enabled));
    }
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineToggle.intent.match, offlineToggleWorker, options);
}
