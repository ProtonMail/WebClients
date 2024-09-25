import { put, takeEvery } from 'redux-saga/effects';

import { getFeatureFlags } from '@proton/pass/lib/user/user.requests';
import { getUserFeaturesFailure, getUserFeaturesIntent, getUserFeaturesSuccess } from '@proton/pass/store/actions';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { RootSagaOptions } from '@proton/pass/store/types';

/* Try to sync the user feature flags on each wakeup success :
/* `getUserFeatures` will only request pass feature flags from the api
 * if the `requestedAt` timestamp is more than a day old */
function* syncFeatures(
    { getAuthStore, onFeatureFlags }: RootSagaOptions,
    { meta }: ReturnType<typeof getUserFeaturesIntent>
) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLocked();
        if (!loggedIn || locked) throw new Error('Cannot fetch user features');

        const incoming: FeatureFlagState = yield getFeatureFlags();
        yield put(getUserFeaturesSuccess(meta.request.id, incoming));

        onFeatureFlags?.(incoming);
    } catch (error: unknown) {
        yield put(getUserFeaturesFailure(meta.request.id, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(getUserFeaturesIntent.match, syncFeatures, options);
}
