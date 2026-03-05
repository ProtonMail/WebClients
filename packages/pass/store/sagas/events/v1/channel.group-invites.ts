import { all, call, fork } from 'redux-saga/effects';

import type { EventManagerEvent } from '@proton/pass/lib/events/manager';
import { NOOP_EVENT } from '@proton/pass/lib/events/manager';
import { getGroupInvitesQuery } from '@proton/pass/lib/invites/invite.requests';
import type { GroupInvitesGetResponse } from '@proton/pass/lib/sync/v1/invite-polling.processor';
import { processGroupInvitePollingEvent } from '@proton/pass/lib/sync/v1/invite-polling.processor';
import { eventChannelFactory } from '@proton/pass/store/sagas/events/v1/channel.factory';
import { channelEvents, channelInitalize } from '@proton/pass/store/sagas/events/v1/channel.worker';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const NAMESPACE = 'Polling::GroupInvites';

function* onGroupInvitesEvent(event: EventManagerEvent<GroupInvitesGetResponse>) {
    if ('error' in event) throw event.error;
    yield call(processGroupInvitePollingEvent, event);
}

export const createGroupInvitesChannel = (api: Api) =>
    eventChannelFactory<GroupInvitesGetResponse>({
        api,
        channelId: 'group-invites',
        initialEventID: NOOP_EVENT,
        getCursor: () => ({ EventID: NOOP_EVENT, More: false }),
        query: getGroupInvitesQuery,
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
