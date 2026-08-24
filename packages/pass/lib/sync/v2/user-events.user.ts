import { call, put } from 'redux-saga/effects';

import { setBreaches, setUserAccess } from '../../../store/actions';
import { setOrganizationSettings } from '../../../store/actions/creators/organization';
import type { HydratedAccessState } from '../../../store/reducers';
import type { RootSagaOptions } from '../../../store/types';
import type {
    BreachesGetResponse,
    Maybe,
    MaybeNull,
    OrganizationGetResponse,
    SyncEventChangedWithTokenOutput,
} from '../../../types';
import { getAllBreaches } from '../../monitor/monitor.request';
import { getOrganizationSettings } from '../../organization/organization.requests';
import { getUserAccess } from '../../user/user.requests';
import { onOrganizationSettingsUpdated } from '../common/organization';
import type { EventProcessor } from '../types';

/** Refreshes user access state when the server signals a change. */
export function* processUserRefresh(refresh: boolean): EventProcessor {
    if (!refresh) return true;

    try {
        const access: HydratedAccessState = yield call(getUserAccess);
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
