import { put, select, takeLeading } from 'redux-saga/effects';

import { setUserPlan, wakeupSuccess } from '../actions';
import type { UserPlanState } from '../reducers';
import type { State } from '../types';
import { getUserPlan } from './workers/user';

/* Try to sync the user plan on each wakeup success */
function* syncPlan() {
    try {
        const { user }: State = yield select();
        const plan: UserPlanState = yield getUserPlan(user);
        yield plan !== user.plan && put(setUserPlan(plan));
    } catch (err) {}
}

export default function* watcher() {
    yield takeLeading(wakeupSuccess.match, syncPlan);
}
