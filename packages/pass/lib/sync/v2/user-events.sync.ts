import { all, call, put, select } from 'redux-saga/effects';

import { allInvites } from '@proton/pass/lib/invites/invite.requests';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { getAllBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { getOrganizationForPlan } from '@proton/pass/lib/organization/organization.requests';
import { dedupeShares } from '@proton/pass/lib/shares/share.dedupe';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShares } from '@proton/pass/lib/shares/share.requests';
import { createDefaultVault } from '@proton/pass/lib/sync/common/vaults';
import { notifyInactiveShares } from '@proton/pass/lib/sync/notifications';
import type { EventProcessor } from '@proton/pass/lib/sync/types';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { syncResult } from '@proton/pass/store/actions';
import type { HydratedAccessState, ItemsByShareId, SharesState, VaultShareItem } from '@proton/pass/store/reducers';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { ShareDedupeState } from '@proton/pass/store/reducers/shares-dedupe';
import { selectLoadGroupInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { BreachesGetResponse, Invite, Maybe, MaybeNull, Share, ShareGetResponse } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { getUserEventLatestID } from './user-events.requests';

export type SyncResultV2 = {
    access: HydratedAccessState;
    breaches: BreachesGetResponse;
    invites: Invite[];
    items: ItemsByShareId;
    organization: MaybeNull<OrganizationState>;
    shares: SharesState;
    userEventId: string;
    dedupe: ShareDedupeState;
    v: 2;
};

const intoItemsByShareId = async ({ shareId }: Share): Promise<ItemsByShareId> => ({
    [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
});

/** Initialization step before polling user events v2 can start. This will ensure that no events are
 * lost since events will be processed from the moment in time just before the initial data sync happens.
 * The `lastEventID` is just before this initial moment. Do not start polling before this finishes.
 * NOTE: `state` is passed from the hydration step preceding this call —
 * user state (plan, groups, feature flags) is guaranteed to be hydrated.  */
export function* syncV2(state: State, { getCore }: RootSagaOptions): Generator<unknown, SyncResultV2> {
    /** 1. Get latest user-events eventID */
    const userEventId: string = yield call(getUserEventLatestID);
    /** 2a. Get user access state */
    const access: HydratedAccessState = yield call(getUserAccess);
    /** 2b. Get organization state (no-op for non-business plans) */
    const organization: MaybeNull<OrganizationState> = yield call(getOrganizationForPlan, access.plan);
    /** 3a. Get all shares */
    const encryptedShares: ShareGetResponse[] = yield call(requestShares);
    /** 3b. Open all shares (may fail on inactive keys) */
    const maybeShares: Maybe<Share>[] = yield all(encryptedShares.map((s) => call(parseShareResponse, s)));
    /** 3c. Split active from inactive shares  */
    const [shares, inactiveShares] = partition(maybeShares, (s): s is Share => Boolean(s));
    /** 3d. Notify if any shares could not be opened */
    if (inactiveShares.length > 0) yield call(notifyInactiveShares);
    /** 3e. Create default vault if necessary */
    const defaultVault: Maybe<VaultShareItem> = yield call(createDefaultVault, shares);
    if (defaultVault) shares.push(defaultVault);

    /** 4. Get all items for all active shares */
    const items: ItemsByShareId[] = yield all(shares.map((s) => call(intoItemsByShareId, s)));
    /** 5. Get all invites — filter out stale accepted invites before parsing */
    const loadGroupInvites: boolean = selectLoadGroupInvites(state);
    const invites: Invite[] = yield call(allInvites, loadGroupInvites);
    /** 6. Get all breaches */
    const breaches: BreachesGetResponse = yield call(getAllBreaches);

    return {
        access,
        breaches,
        invites,
        items: items.reduce(diadic(merge), {}),
        organization,
        shares: toMap(shares, 'shareId'),
        userEventId,
        dedupe: yield dedupeShares(shares, getCore()),
        v: 2,
    };
}

export function* processFullRefresh(options: RootSagaOptions): EventProcessor {
    try {
        const state: State = yield select();
        const result: SyncResultV2 = yield call(syncV2, state, options);
        yield put(syncResult(result));
        return true;
    } catch {
        return false;
    }
}
