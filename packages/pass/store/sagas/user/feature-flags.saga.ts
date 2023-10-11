import { fork, put, select, takeEvery, takeLeading } from 'redux-saga/effects';

import { getFeatureFlags } from '@proton/pass/lib/user/user.requests';
import { setUserFeatures, wakeupSuccess } from '@proton/pass/store/actions';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import { SessionLockStatus } from '@proton/pass/types';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

/* Try to sync the user feature flags on each wakeup success :
/* `getUserFeatures` will only request pass feature flags from the api
 * if the `requestedAt` timestamp is more than a day old */
function* syncFeatures({ getAuth }: WorkerRootSagaOptions) {
    try {
        const loggedIn = getAuth().hasSession();
        const locked = getAuth().getLockStatus() === SessionLockStatus.LOCKED;

        if (loggedIn && !locked) {
            const { user }: State = yield select();
            const features: FeatureFlagState = yield getFeatureFlags(user);

            if (!isDeepEqual(features, user.features)) yield put(setUserFeatures(features));
        }
    } catch {}
}

/* dedicated watcher for user features updates as the `setUserFeatures`
 * action may be dispatched outside of this saga */
function* listenForChanges({ onFeatureFlagsUpdate }: WorkerRootSagaOptions) {
    yield takeEvery(setUserFeatures.match, function* ({ payload }) {
        yield onFeatureFlagsUpdate?.(payload);
    });
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield fork(listenForChanges, options);
    yield takeLeading(wakeupSuccess.match, syncFeatures, options);
}
