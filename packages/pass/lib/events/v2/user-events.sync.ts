import { call, put } from 'redux-saga/effects';

import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShares } from '@proton/pass/lib/shares/share.requests';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { sync } from '@proton/pass/store/actions';
import type { HydratedAccessState, ItemsByShareId, SharesState } from '@proton/pass/store/reducers';
import type { Share, ShareGetResponse } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { diadic } from '@proton/pass/utils/fp/variadics';
import { merge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { getUserEventLatestID } from './user-events.requests';
import type { EventProcessor } from './user-events.types';

// import { getInvites } from '@proton/pass/lib/invites/invite.requests';

export type SyncResultV2 = {
    v: 2;
    userEventID: string;
    shares: SharesState;
    items: ItemsByShareId;
    access: HydratedAccessState;
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
 * The `lastEventID` is just before this initial moment. Do not start polling before this finishes.  */
export function* syncV2(): Generator<unknown, SyncResultV2> {
    /** 1. Get latest user-events eventID */
    const userEventID: string = yield getUserEventLatestID();
    /** 2. Get user info */
    const access: HydratedAccessState = yield getUserAccess();
    /** 3a. Get all shares */
    const encryptedShares: ShareGetResponse[] = yield requestShares();
    /** 3b. Open all shares (may fail on inactive keys) */
    const shares: RemoteShare[] = yield Promise.all(encryptedShares.map(intoRemoteShare));
    /** 3c. Split active from inactive shares (FIXME: notify on inactive) */
    const [activeShares] = partition(shares, (s): s is Required<RemoteShare> => Boolean(s.share));
    /** 4. Get all items for all active shares */
    const items: ItemsByShareId[] = yield Promise.all(activeShares.map(intoItemsByShareId));
    /** 5. Get all invites - FIXME: add after group-sharing rebase */
    // const invites = yield getInvites()

    return {
        v: 2,
        userEventID,
        access,
        shares: toMap(activeShares.map(prop('share')), 'shareId'),
        items: items.reduce(diadic(merge), {}),
    };
}

export function* processFullRefresh(): EventProcessor {
    try {
        const result: SyncResultV2 = yield call(syncV2);
        yield put(sync(result));
        return true;
    } catch {
        return false;
    }
}
