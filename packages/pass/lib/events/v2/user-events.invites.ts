import { put, select } from 'redux-saga/effects';

import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { getGroupInvites, getUserInvites } from '@proton/pass/lib/invites/invite.requests';
import { partitionGroupInvites } from '@proton/pass/lib/invites/invite.utils';
import { syncInvites } from '@proton/pass/store/actions';
import { selectAllVaultIDs } from '@proton/pass/store/selectors';
import type { GroupInvite, UserInvite } from '@proton/pass/types';
import { InviteType, type MaybeNull, type ShareId, type SyncEventChangedWithTokenOutput } from '@proton/pass/types';
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
