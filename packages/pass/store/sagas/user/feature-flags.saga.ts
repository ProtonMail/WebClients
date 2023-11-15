import { put, select, takeEvery } from 'redux-saga/effects';

import { getFeatureFlags } from '@proton/pass/lib/user/user.requests';
import { getUserFeaturesFailure, getUserFeaturesIntent, getUserFeaturesSuccess } from '@proton/pass/store/actions';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { selectFeatureFlags } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { SessionLockStatus } from '@proton/pass/types';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

/* Try to sync the user feature flags on each wakeup success :
/* `getUserFeatures` will only request pass feature flags from the api
 * if the `requestedAt` timestamp is more than a day old */
function* syncFeatures(
    { getAuthStore, onFeatureFlagsUpdate }: WorkerRootSagaOptions,
    { meta }: ReturnType<typeof getUserFeaturesIntent>
) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLockStatus() === SessionLockStatus.LOCKED;
        if (!loggedIn || locked) throw new Error('Cannot fetch user features');

        const current: FeatureFlagState = yield select(selectFeatureFlags);
        const incoming: FeatureFlagState = yield getFeatureFlags();
        yield put(getUserFeaturesSuccess(meta.request.id, incoming));

        if (!isDeepEqual(current, incoming)) onFeatureFlagsUpdate?.(incoming);
    } catch (error: unknown) {
        yield put(getUserFeaturesFailure(meta.request.id, error));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(getUserFeaturesIntent.match, syncFeatures, options);
}
