import { call, put } from 'redux-saga/effects';

import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { getAllBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { setBreaches, setUserAccess } from '@proton/pass/store/actions';
import type { HydratedAccessState } from '@proton/pass/store/reducers';
import type { BreachesGetResponse, MaybeNull, SyncEventChangedWithTokenOutput } from '@proton/pass/types';

/** Refreshes user access state when the server signals a change.
 *
 * FIXME: check if we need to trigger a full user-refresh for user keys etc.
 * The V1 `userEvent` handler also processes `User`, `Addresses`, `UserSettings`,
 * and `AuthDevices` — currently we only re-fetch access state here. */
export function* processUserRefresh(refresh: boolean): EventProcessor {
    if (!refresh) return true;

    try {
        const access: HydratedAccessState = yield getUserAccess();
        yield put(setUserAccess(access));
        return true;
    } catch {
        return false;
    }
}

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
