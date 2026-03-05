import { put, select } from 'redux-saga/effects';

import { parseGroupInvite, parseUserInvite } from '@proton/pass/lib/invites/invite.parser';
import { partitionGroupInvites } from '@proton/pass/lib/invites/invite.utils';
import type { EventProcessor } from '@proton/pass/lib/sync/types';
import { syncInvites } from '@proton/pass/store/actions';
import type { InviteState } from '@proton/pass/store/reducers';
import { selectInvites } from '@proton/pass/store/selectors/invites';
import type {
    GroupInvite,
    GroupInvitesListResponse,
    InvitesGetResponse,
    Maybe,
    MaybeNull,
    UserInvite,
} from '@proton/pass/types';
import { InviteType } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { toMap } from '@proton/shared/lib/helpers/object';

export type GroupInvitesGetResponse = { Invites: GroupInvitesListResponse };

/** Processes user invite polling results: diffs against cached invites,
 * parses new ones, filters out already-accepted invites. Called from
 * V1 legacy channels and imperatively during migration. */
export function* processUserInvitePollingEvent(event: InvitesGetResponse): EventProcessor {
    try {
        const cachedInvites: InviteState = yield select(selectInvites);
        const cachedInviteTokens = Object.keys(cachedInvites);

        const noop =
            event.Invites.length === cachedInviteTokens.length &&
            event.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

        if (noop) return true;

        logger.info(`[Polling::Invites] ${event.Invites.length} new invite(s) received`);

        const invites: MaybeNull<UserInvite>[] = yield Promise.all(
            event.Invites.map<Promise<MaybeNull<UserInvite>>>(async (invite) => {
                const cached = cachedInvites[invite.InviteToken] as Maybe<UserInvite>;
                return cached ?? parseUserInvite(invite);
            })
        );

        const invitesMap = toMap(invites.filter(truthy), 'token');
        yield put(syncInvites({ type: InviteType.User, invites: invitesMap }));

        return true;
    } catch {
        return false;
    }
}

/** Processes group invite polling results: diffs against cached invites,
 * parses new ones, partitions into owner/org types. Called from V1 legacy
 * channels and imperatively during migration. */
export function* processGroupInvitePollingEvent(event: GroupInvitesGetResponse): EventProcessor {
    try {
        const cachedInvites: InviteState = yield select(selectInvites);
        const cachedInviteTokens = Object.keys(cachedInvites);

        const noop =
            event.Invites.Invites.length === cachedInviteTokens.length &&
            event.Invites.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

        if (noop) return true;

        logger.info(`[Polling::GroupInvites] ${event.Invites.Invites.length} new invite(s) received`);

        const invites: MaybeNull<GroupInvite>[] = yield Promise.all(
            event.Invites.Invites.map<Promise<MaybeNull<GroupInvite>>>(async (invite) => {
                const cached = cachedInvites[invite.InviteToken] as Maybe<GroupInvite>;
                return cached ?? parseGroupInvite(invite);
            })
        );

        const [owners, orgs] = partitionGroupInvites(invites.filter(truthy));
        yield put(syncInvites({ type: InviteType.GroupOwner, invites: toMap(owners, 'token') }));
        yield put(syncInvites({ type: InviteType.GroupOrg, invites: toMap(orgs, 'token') }));

        return true;
    } catch {
        return false;
    }
}
