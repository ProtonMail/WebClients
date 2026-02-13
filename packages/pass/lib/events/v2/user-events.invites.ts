import { put, select } from 'redux-saga/effects';

import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { getGroupInvites, getUserInvites } from '@proton/pass/lib/invites/invite.requests';
import { partitionGroupInvites } from '@proton/pass/lib/invites/invite.utils';
import { getShareAccessOptions, syncInvites } from '@proton/pass/store/actions';
import { selectAllVaultIDs, selectItemsByShareId, selectShare } from '@proton/pass/store/selectors';
import type { GroupInvite, ItemRevision, Maybe, Share, SyncEventShareOutput, UserInvite } from '@proton/pass/types';
import {
    InviteType,
    type MaybeNull,
    type ShareId,
    ShareType,
    type SyncEventChangedWithTokenOutput,
} from '@proton/pass/types';
import { toMap } from '@proton/shared/lib/helpers/object';

export function* processInvitesChanged(event?: MaybeNull<SyncEventChangedWithTokenOutput>): EventProcessor {
    if (!event) return true;

    try {
        const vaultIDs: Set<ShareId> = yield select(selectAllVaultIDs);
        const invites: UserInvite[] = yield getUserInvites(vaultIDs);
        yield put(syncInvites({ type: InviteType.User, invites: toMap(invites, 'token') }));

        return true;
    } catch {
        return false;
    }
}

export function* processGroupInvitesChanged(event?: MaybeNull<SyncEventChangedWithTokenOutput>): EventProcessor {
    if (!event) return true;

    try {
        const vaultIDs: Set<ShareId> = yield select(selectAllVaultIDs);
        const invites: GroupInvite[] = yield getGroupInvites(vaultIDs);
        const [owners, orgs] = partitionGroupInvites(invites);
        yield put(syncInvites({ type: InviteType.GroupOwner, invites: toMap(owners, 'token') }));
        yield put(syncInvites({ type: InviteType.GroupOrg, invites: toMap(orgs, 'token') }));

        return true;
    } catch {
        return false;
    }
}

/** Revalidates share access options for shares with pending invite creation.
 * Share access data is not cached — it's treated as hot data re-fetched on
 * demand. FIXME: once V2 sync is stable, remove the polling in share access
 * views and rely solely on this event-driven revalidation. */
export function* processSharesWithInvitesToCreate(shares: SyncEventShareOutput[]): EventProcessor {
    if (shares.length === 0) return true;

    try {
        for (const { ShareID: shareId } of shares) {
            const share: Maybe<Share> = yield select(selectShare(shareId));
            if (!share) continue;

            switch (share.targetType) {
                case ShareType.Vault:
                    yield put(getShareAccessOptions.intent({ shareId }));
                    break;
                case ShareType.Item: {
                    /** An item share contains a single item — resolve its itemId
                     * to build the correct access options request. */
                    const [item]: ItemRevision[] = yield select(selectItemsByShareId(shareId));
                    if (item) yield put(getShareAccessOptions.intent({ shareId, itemId: item.itemId }));
                    break;
                }
            }
        }

        return true;
    } catch {
        return false;
    }
}
