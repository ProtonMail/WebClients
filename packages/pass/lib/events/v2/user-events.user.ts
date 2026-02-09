import { call, put } from 'redux-saga/effects';

import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { getAllBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { getOrganizationSettings } from '@proton/pass/lib/organization/organization.requests';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { setBreaches, setUserAccess } from '@proton/pass/store/actions';
import { setOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import type { HydratedAccessState } from '@proton/pass/store/reducers';
import { onOrganizationSettingsUpdated } from '@proton/pass/store/sagas/organization/organization.settings.saga';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type {
    BreachesGetResponse,
    Maybe,
    MaybeNull,
    OrganizationGetResponse,
    SyncEventChangedWithTokenOutput,
} from '@proton/pass/types';

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

/** Re-fetches organization settings when the server signals a change.
 * Applies the `ForceLockSeconds` side-effect via `onOrganizationSettingsUpdated`
 * (syncs the local lock TTL and re-persists the session when needed). */
export function* processOrganizationInfoChanged(
    event: Maybe<MaybeNull<SyncEventChangedWithTokenOutput>>,
    options: RootSagaOptions
): EventProcessor {
    try {
        if (!event) return true;

        const settings: OrganizationGetResponse = yield call(getOrganizationSettings);
        yield put(setOrganizationSettings(settings));
        yield call(onOrganizationSettingsUpdated, settings, options);
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
