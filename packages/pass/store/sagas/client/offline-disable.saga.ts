import { takeLeading } from 'redux-saga/effects';

import type { EncryptedAuthSession } from '@proton/pass/lib/auth/session';
import { clientOffline } from '@proton/pass/lib/client';
import { offlineDisable } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';

function* offlineDisableWorker({ getAuthService, getAuthStore, getAppState }: RootSagaOptions) {
    const auth = getAuthService();
    const authStore = getAuthStore();
    const { status } = getAppState();

    authStore.setOfflineConfig(undefined);
    authStore.setOfflineKD(undefined);

    /** If the client is offline-unlocked, we cannot properly re-persist the session
     * because the session is not resumed. We need access to the `keyPassword` in
     * the AuthSession for session persisting. In this case, fallback to removing
     * the `offlineConfig` and save. */
    if (clientOffline(status)) {
        const localID = authStore.getLocalID();
        const persistedSession: MaybeNull<EncryptedAuthSession> = yield auth.config.getPersistedSession(localID);

        if (persistedSession) {
            const session = { ...persistedSession };
            delete session.offlineConfig;
            yield auth.config.onSessionPersist?.(JSON.stringify(session));
        }
    } else yield auth.persistSession();
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineDisable.match, offlineDisableWorker, options);
}
