import { put, select, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { type OfflineComponents, getOfflineComponents } from '@proton/pass/lib/cache/crypto';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { offlineToggle } from '@proton/pass/store/actions';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { UserPassPlan } from '@proton/pass/types/api/plan';

function* offlineToggleWorker(
    { getAuthService, getAuthStore }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof offlineToggle.intent>
) {
    const auth = getAuthService();
    const authStore = getAuthStore();
    const requestId = meta.request.id;

    try {
        const plan: UserPassPlan = yield select(selectPassPlan);
        if (!isPaidPlan(plan)) throw new Error();

        const verified: boolean = yield auth.confirmPassword(payload.loginPassword);
        if (!verified) {
            const message = authStore.getExtraPassword()
                ? c('Error').t`Wrong extra password`
                : c('Error').t`Wrong password`;
            throw new Error(message);
        }

        const hasOfflineComponents = authStore.getOfflineKD() && authStore.getOfflineConfig();

        /** If the user does not have offline components setup on
         * the authentication store, generate the `offlineConfig`
         * `offlineKD` and persist the session immediately */
        if (payload.enabled && !hasOfflineComponents) {
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
