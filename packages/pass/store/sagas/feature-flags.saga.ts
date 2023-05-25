import { put, select, takeLeading } from 'redux-saga/effects';

import { setUserFeatures, wakeupSuccess } from '../actions';
import type { UserFeatureState } from '../reducers';
import type { State } from '../types';
import { getUserFeatures } from './workers/user';

/* Try to sync the user feature flags on each wakeup success :
/* `getUserFeatures` will only request pass feature flags from the api
 * if the `requestedAt` timestamp is more than a day old */
function* syncFeatures() {
    try {
        const { user }: State = yield select();
        const features: UserFeatureState = yield getUserFeatures(user);
        yield features !== user.features && put(setUserFeatures(features));
    } catch (err) {}
}

export default function* watcher() {
    yield takeLeading(wakeupSuccess.match, syncFeatures);
}
