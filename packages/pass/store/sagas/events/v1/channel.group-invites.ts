import { all, call, fork } from 'redux-saga/effects';

import type { EventManagerEvent } from '../../../../lib/events/manager';
import { NOOP_EVENT } from '../../../../lib/events/manager';
import { getGroupInvitesQuery } from '../../../../lib/invites/invite.requests';
import type { GroupInvitesGetResponse } from '../../../../lib/sync/v1/invite-polling.processor';
import { processGroupInvitePollingEvent } from '../../../../lib/sync/v1/invite-polling.processor';
import type { Api } from '../../../../types';
import { logger } from '../../../../utils/logger';
import type { RootSagaOptions } from '../../../types';
import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';

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
