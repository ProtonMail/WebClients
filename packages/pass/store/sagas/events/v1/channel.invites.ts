import { all, call, fork } from 'redux-saga/effects';

import type { EventManagerEvent } from '@proton/pass/lib/events/manager';
import { NOOP_EVENT } from '@proton/pass/lib/events/manager';
import { getUserInvitesQuery } from '@proton/pass/lib/invites/invite.requests';
import { processUserInvitePollingEvent } from '@proton/pass/lib/sync/v1/invite-polling.processor';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, InvitesGetResponse } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';

const NAMESPACE = 'Polling::Invites';

function* onInvitesEvent(event: EventManagerEvent<InvitesGetResponse>) {
    if ('error' in event) throw event.error;
    yield call(processUserInvitePollingEvent, event);
}

export const createInvitesChannel = (api: Api) =>
    eventChannelFactory<InvitesGetResponse>({
        api,
        channelId: 'invites',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: getUserInvitesQuery,
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
