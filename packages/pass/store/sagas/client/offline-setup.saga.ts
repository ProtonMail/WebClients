import { put, select, takeLeading } from 'redux-saga/effects';

import { CACHE_SALT_LENGTH, OFFLINE_ARGON2_PARAMS, getOfflineKeyDerivation } from '@proton/pass/lib/cache/crypto';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { getUserSettings } from '@proton/pass/lib/user/user.requests';
import { offlineSetupFailure, offlineSetupIntent, offlineSetupSuccess } from '@proton/pass/store/actions';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { UserPassPlan } from '@proton/pass/types/api/plan';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { SETTINGS_PASSWORD_MODE, type UserSettings } from '@proton/shared/lib/interfaces';

function* offlineSetupWorker(
    { getAuthService, getAuthStore }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof offlineSetupIntent>
) {
    const auth = getAuthService();
    const authStore = getAuthStore();
    const requestId = meta.request.id;

    try {
        const plan: UserPassPlan = yield select(selectPassPlan);
        if (!isPaidPlan(plan)) throw new Error();

        /** Offline mode can only work for users in ONE_PASSWORD_MODE.
         * Secondary encryption password cannot be verified through SRP */
        const settings: UserSettings = yield getUserSettings();
        if (settings.Password.Mode !== SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE) throw new Error();

        const verified: boolean = yield auth.confirmPassword(payload.loginPassword);
        if (!verified) throw new Error();

        const offlineSalt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));

        const offlineKD: Uint8Array = yield getOfflineKeyDerivation(payload.loginPassword, offlineSalt).catch(
            (error) => {
                captureMessage('Offline: Argon2 error', {
                    level: 'error',
                    extra: { error, context: OFFLINE_ARGON2_PARAMS },
                });

                throw error;
            }
        );

        authStore.setOfflineConfig({ salt: uint8ArrayToString(offlineSalt), params: OFFLINE_ARGON2_PARAMS });
        authStore.setOfflineKD(uint8ArrayToString(offlineKD));
        yield auth.persistSession();

        yield put(offlineSetupSuccess(requestId));
    } catch (error: unknown) {
        authStore.setOfflineConfig(undefined);
        authStore.setOfflineKD(undefined);
        yield put(offlineSetupFailure(requestId, error));
    }
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineSetupIntent.match, offlineSetupWorker, options);
}
