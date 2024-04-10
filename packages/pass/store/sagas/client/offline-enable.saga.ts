import { put, select, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { type OfflineComponents, getOfflineComponents } from '@proton/pass/lib/cache/crypto';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { getUserSettings } from '@proton/pass/lib/user/user.requests';
import { offlineSetupFailure, offlineSetupIntent, offlineSetupSuccess } from '@proton/pass/store/actions';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { UserPassPlan } from '@proton/pass/types/api/plan';
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

        const settings: UserSettings = yield getUserSettings();

        /** Offline mode can only work for users in ONE_PASSWORD_MODE.
         * Secondary encryption password cannot be verified through SRP */
        if (settings.Password.Mode !== SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE) {
            throw new Error(c('Error').t`Offline mode is currently not available for two password mode.`);
        }

        const verified: boolean = yield auth.confirmPassword(payload.loginPassword);
        if (!verified) throw new Error(c('Error').t`Wrong password`);

        const { offlineConfig, offlineKD }: OfflineComponents = yield getOfflineComponents(payload.loginPassword);
        authStore.setOfflineConfig(offlineConfig);
        authStore.setOfflineKD(offlineKD);

        yield put(offlineSetupSuccess(requestId));
    } catch (error: unknown) {
        yield put(offlineSetupFailure(requestId, error));
    }
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineSetupIntent.match, offlineSetupWorker, options);
}
