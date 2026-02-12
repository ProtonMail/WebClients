import { all, fork, put, select } from 'redux-saga/effects';

import type { EventManagerEvent } from '@proton/pass/lib/events/manager/manager';
import { NOOP_EVENT } from '@proton/pass/lib/events/manager/manager';
import { parseGroupInvite } from '@proton/pass/lib/invites/invite.parser';
import { isAcceptedInvite, partitionGroupInvites } from '@proton/pass/lib/invites/invite.utils';
import { syncInvites } from '@proton/pass/store/actions';
import type { InviteState } from '@proton/pass/store/reducers';
import { eventChannelFactory } from '@proton/pass/store/sagas/events/v1/channel.factory';
import { channelEvents, channelInitalize } from '@proton/pass/store/sagas/events/v1/channel.worker';
import { selectAllVaultIDs } from '@proton/pass/store/selectors';
import { selectInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, GroupInvitesListResponse, Maybe, MaybeNull } from '@proton/pass/types';
import { InviteType } from '@proton/pass/types';
import type { GroupInvite } from '@proton/pass/types/data/invites';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { toMap } from '@proton/shared/lib/helpers/object';

const NAMESPACE = 'ServerEvents::GroupInvites';

type GroupInvitesGetResponse = { Invites: GroupInvitesListResponse };

function* onGroupInvitesEvent(event: EventManagerEvent<GroupInvitesGetResponse>) {
    if ('error' in event) throw event.error;

    const cachedInvites: InviteState = yield select(selectInvites);
    const cachedInviteTokens = Object.keys(cachedInvites);

    const noop =
        event.Invites.Invites.length === cachedInviteTokens.length &&
        event.Invites.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

    if (noop) return;

    logger.info(`[${NAMESPACE}] ${event.Invites.Invites.length} new invite(s) received`);
    const vaultIDs: Set<string> = yield select(selectAllVaultIDs);
    const isAcceptedGroupInvite = isAcceptedInvite(vaultIDs);

    const invites: MaybeNull<GroupInvite>[] = yield Promise.all(
        event.Invites.Invites.map<Promise<MaybeNull<GroupInvite>>>(async (invite) => {
            if (isAcceptedGroupInvite(invite)) return null;
            const cached = cachedInvites[invite.InviteToken] as Maybe<GroupInvite>;
            return cached ?? parseGroupInvite(invite);
        })
    );

    const [owners, orgs] = partitionGroupInvites(invites.filter(truthy));
    yield put(syncInvites({ type: InviteType.GroupOwner, invites: toMap(owners, 'token') }));
    yield put(syncInvites({ type: InviteType.GroupOrg, invites: toMap(orgs, 'token') }));
}

export const createGroupInvitesChannel = (api: Api) =>
    eventChannelFactory<GroupInvitesGetResponse>({
        api,
        channelId: 'group-invites',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: () => ({ url: `pass/v1/invite/group`, method: 'get' }),
        onEvent: onGroupInvitesEvent,
        onClose: () => logger.info(`[${NAMESPACE}] closing channel`),
    });

export function* groupInvitesChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[${NAMESPACE}] start polling`);

    const eventsChannel = createGroupInvitesChannel(api);
    const events = fork(channelEvents<GroupInvitesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelInitalize<GroupInvitesGetResponse>, eventsChannel, options);

    yield all([events, wakeup]);
}
