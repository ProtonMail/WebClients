import { call, put } from 'redux-saga/effects';

import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { getAllBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { setBreaches } from '@proton/pass/store/actions';
import type { BreachesGetResponse, MaybeNull, SyncEventChangedWithTokenOutput } from '@proton/pass/types';

export function* processBreachUpdate(event?: MaybeNull<SyncEventChangedWithTokenOutput>): EventProcessor {
    try {
        if (!event) return true;

        const breaches: BreachesGetResponse = yield call(getAllBreaches);
        yield put(setBreaches(breaches));
        return true;
    } catch {
        return false;
    }
}
