import { put, select } from 'redux-saga/effects';

import { toMap } from '@proton/shared/lib/helpers/object';

import { getShareAccessOptions } from '../../../store/actions/creators/access';
import { syncInvites } from '../../../store/actions/creators/invite';
import { selectItemsByShareId } from '../../../store/selectors/items';
import { selectShare } from '../../../store/selectors/shares';
import type { SyncEventChangedWithTokenOutput, SyncEventShareOutput } from '../../../types/api/pass';
import { type GroupInvite, InviteType, type UserInvite } from '../../../types/data/invites';
import type { ItemRevision } from '../../../types/data/items';
import { type Share, ShareType } from '../../../types/data/shares';
import type { Maybe, MaybeNull } from '../../../types/utils';
import { resolveGroupInvites, resolveUserInvites } from '../../invites/invite.requests';
import { partitionGroupInvites } from '../../invites/invite.utils';
import type { EventProcessor } from '../types';

export function* processInvitesChanged(event?: MaybeNull<SyncEventChangedWithTokenOutput>): EventProcessor {
    if (!event) return true;

    try {
        const invites: UserInvite[] = yield resolveUserInvites();
        yield put(syncInvites({ type: InviteType.User, invites: toMap(invites, 'token') }));

        return true;
    } catch {
        return false;
    }
}

export function* processGroupInvitesChanged(event?: MaybeNull<SyncEventChangedWithTokenOutput>): EventProcessor {
    if (!event) return true;

    try {
        const invites: GroupInvite[] = yield resolveGroupInvites();
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
