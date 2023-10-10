import { put, select, takeLeading } from 'redux-saga/effects';

import { SessionLockStatus } from '../../types';
import { setUserFeatures, wakeupSuccess } from '../actions';
import type { FeatureFlagState } from '../reducers';
import type { State, WorkerRootSagaOptions } from '../types';
import { getFeatureFlags } from './workers/user';

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
            yield features !== user.features && put(setUserFeatures(features));
        }
    } catch (err) {}
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(wakeupSuccess.match, syncFeatures, options);
}
