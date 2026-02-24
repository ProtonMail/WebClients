import { call, put, select } from 'redux-saga/effects';

import { notifyInactiveShares } from '@proton/pass/lib/events/migrate';
import type { EventProcessor } from '@proton/pass/lib/events/types';
import { allInvites } from '@proton/pass/lib/invites/invite.requests';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { getAllBreaches } from '@proton/pass/lib/monitor/monitor.request';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShares } from '@proton/pass/lib/shares/share.requests';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { sync } from '@proton/pass/store/actions';
import type { HydratedAccessState, ItemsByShareId, SharesState } from '@proton/pass/store/reducers';
import { selectLoadGroupInvites } from '@proton/pass/store/selectors/invites';
import type { State } from '@proton/pass/store/types';
import type { BreachesGetResponse, Invite, Share, ShareGetResponse } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { getUserEventLatestID } from './user-events.requests';

export type SyncResultV2 = {
    access: HydratedAccessState;
    breaches: BreachesGetResponse;
    invites: Invite[];
    items: ItemsByShareId;
    shares: SharesState;
    userEventID: string;
    v: 2;
};

type RemoteShare = { shareId: string; share?: Share };

const intoRemoteShare = async (encryptedShare: ShareGetResponse): Promise<RemoteShare> => ({
    shareId: encryptedShare.ShareID,
    share: await parseShareResponse(encryptedShare),
});

const intoItemsByShareId = async ({ shareId }: RemoteShare): Promise<ItemsByShareId> => ({
    [shareId]: toMap(await requestItemsForShareId(shareId), 'itemId'),
});

/** Initialization step before polling user events v2 can start. This will ensure that no events are
 * lost since events will be processed from the moment in time just before the initial data sync happens.
 * The `lastEventID` is just before this initial moment. Do not start polling before this finishes.
 * NOTE: `state` is passed from the hydration step preceding this call —
 * user state (plan, groups, feature flags) is guaranteed to be hydrated.  */
export function* syncV2(state: State): Generator<unknown, SyncResultV2> {
    /** 1. Get latest user-events eventID */
    const userEventID: string = yield getUserEventLatestID();
    /** 2. Get user info */
    const access: HydratedAccessState = yield getUserAccess();
    /** 3a. Get all shares */
    const encryptedShares: ShareGetResponse[] = yield requestShares();
    /** 3b. Open all shares (may fail on inactive keys) */
    const shares: RemoteShare[] = yield Promise.all(encryptedShares.map(intoRemoteShare));
    /** 3c. Split active from inactive shares  */
    const [activeShares, inactiveShares] = partition(shares, (s): s is Required<RemoteShare> => Boolean(s.share));
    if (inactiveShares.length > 0) yield call(notifyInactiveShares);
    /** 4. Get all items for all active shares */
    const items: ItemsByShareId[] = yield Promise.all(activeShares.map(intoItemsByShareId));
    /** 5. Get all invites — filter out stale accepted invites before parsing */
    const vaultIDs = new Set(activeShares.map(prop('shareId')));
    const loadGroupInvites: boolean = selectLoadGroupInvites(state);
    const invites: Invite[] = yield call(allInvites, vaultIDs, loadGroupInvites);
    /** 6. Get all breaches */
    const breaches: BreachesGetResponse = yield call(getAllBreaches);

    return {
        access,
        breaches,
        invites,
        items: items.reduce(diadic(merge), {}),
        shares: toMap(activeShares.map(prop('share')), 'shareId'),
        userEventID,
        v: 2,
    };
}

export function* processFullRefresh(): EventProcessor {
    try {
        const state: State = yield select();
        const result: SyncResultV2 = yield call(syncV2, state);
        yield put(sync(result));
        return true;
    } catch {
        return false;
    }
}
