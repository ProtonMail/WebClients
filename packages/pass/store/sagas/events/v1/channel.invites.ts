import { all, fork, put, select } from 'redux-saga/effects';

import type { EventManagerEvent } from '@proton/pass/lib/events/manager/manager';
import { NOOP_EVENT } from '@proton/pass/lib/events/manager/manager';
import { parseUserInvite } from '@proton/pass/lib/invites/invite.parser';
import { syncInvites } from '@proton/pass/store/actions';
import type { InviteState } from '@proton/pass/store/reducers';
import { selectInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, InvitesGetResponse, MaybeNull } from '@proton/pass/types';
import { InviteType } from '@proton/pass/types';
import type { Invite } from '@proton/pass/types/data/invites';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { toMap } from '@proton/shared/lib/helpers/object';

import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';

const NAMESPACE = 'ServerEvents::Invites';

function* onInvitesEvent(event: EventManagerEvent<InvitesGetResponse>) {
    if ('error' in event) throw event.error;

    const cachedInvites: InviteState = yield select(selectInvites);
    const cachedInviteTokens = Object.keys(cachedInvites);

    const noop =
        event.Invites.length === cachedInviteTokens.length &&
        event.Invites.every(({ InviteToken }) => cachedInviteTokens.includes(InviteToken));

    if (noop) return;

    logger.info(`[${NAMESPACE}] ${event.Invites.length} new invite(s) received`);

    const invites: MaybeNull<Invite>[] = yield Promise.all(
        event.Invites.map<Promise<MaybeNull<Invite>>>(async (invite) => {
            /* if invite already decrypted early return */
            const cachedInvite = cachedInvites[invite.InviteToken];
            if (cachedInvite) return cachedInvite;
            return parseUserInvite(invite);
        })
    );

    const invitesMap = toMap(invites.filter(truthy), 'token');
    yield put(syncInvites({ type: InviteType.User, invites: invitesMap }));
}

export const createInvitesChannel = (api: Api) =>
    eventChannelFactory<InvitesGetResponse>({
        api,
        channelId: 'invites',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: () => ({ url: `pass/v1/invite`, method: 'get' }),
        onEvent: onInvitesEvent,
        onClose: () => logger.info(`[${NAMESPACE}] closing channel`),
    });

export function* invitesChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[${NAMESPACE}] start polling`);

    const eventsChannel = createInvitesChannel(api);
    const events = fork(channelEvents<InvitesGetResponse>, eventsChannel, options);
    const wakeup = fork(channelInitalize<InvitesGetResponse>, eventsChannel, options);

    yield all([events, wakeup]);
}
