import { put, takeEvery } from 'redux-saga/effects';

import { QA_SERVICE } from '../../../lib/qa/service';
import { getFeatureFlags } from '../../../lib/user/user.requests';
import { getUserFeaturesFailure, getUserFeaturesIntent, getUserFeaturesSuccess } from '../../actions';
import type { FeatureFlagAndVariantState } from '../../reducers';
import type { RootSagaOptions } from '../../types';

/* Try to sync the user feature flags on each wakeup success :
/* `getUserFeatures` will only request pass feature flags from the api
 * if the `requestedAt` timestamp is more than a day old */
function* syncFeatures({ getAuthStore, onFeatureFlags, extensionId }: RootSagaOptions, { meta }: ReturnType<typeof getUserFeaturesIntent>) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLocked();
        if (!loggedIn || locked) throw new Error('Cannot fetch user features');

        const incoming: FeatureFlagAndVariantState = yield getFeatureFlags(extensionId);
        if (ENV === 'development') incoming.features.PassUserEventsV1 = QA_SERVICE?.state.sync_strategy_v2 ?? true;

        yield put(getUserFeaturesSuccess(meta.request.id, incoming));

        onFeatureFlags?.(incoming);
    } catch (error: unknown) {
        yield put(getUserFeaturesFailure(meta.request.id, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(getUserFeaturesIntent.match, syncFeatures, options);
}
