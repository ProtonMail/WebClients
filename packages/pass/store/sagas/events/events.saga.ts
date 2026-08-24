import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, call, cancel, fork, select, take } from 'redux-saga/effects';

import { api } from '../../../lib/api/api';
import { SYNC_STRATEGY } from '../../../lib/sync/global';
import { SyncStrategy } from '../../../lib/sync/types';
import type { Api, MaybeNull } from '../../../types';
import { logger } from '../../../utils/logger';
import { lockCreateSuccess, startEventPolling, stopEventPolling } from '../../actions';
import { getOrganizationSettings } from '../../actions/creators/organization';
import { selectLockSetupRequired } from '../../selectors';
import { selectLoadGroupInvites } from '../../selectors/invites';
import type { RootSagaOptions } from '../../types';
import { coreChannel } from './core/channel.core';
import { groupInvitesChannel } from './v1/channel.group-invites';
import { invitesChannel } from './v1/channel.invites';
import { shareChannels } from './v1/channel.share';
import { sharesChannel } from './v1/channel.shares';
import { userEventsChannel } from './v2/channel.user-events';

type EventChannel = (api: Api, options: RootSagaOptions) => Generator;

/** Switch event channel polling mechanism depending on `SYNC_STRATEGY`.
 * For legacy V1: standard shares, invites polling
 * For modern V2: leverage new user events processor */
export function* getEventChannels(): Generator<unknown, EventChannel[]> {
    switch (SYNC_STRATEGY) {
        case SyncStrategy.LEGACY:
            const channels = [coreChannel, shareChannels, sharesChannel, invitesChannel];
            const loadGroupInvites: boolean = yield select(selectLoadGroupInvites);
            if (loadGroupInvites) channels.push(groupInvitesChannel);

            return channels;

        case SyncStrategy.USER_EVENTS:
            return [coreChannel, userEventsChannel];
    }
}

function* eventsWorker(options: RootSagaOptions): Generator {
    const channels: EventChannel[] = yield call(getEventChannels);
    logger.info(`[ServerEvents] Creating polling channels [strategy=${SYNC_STRATEGY}]`);
    yield all(channels.map((channel) => fork(channel, api, options)));
}

const EVENT_POLLING_TRIGGERS = [
    startEventPolling.match,
    stopEventPolling.match,
    lockCreateSuccess.match,
    getOrganizationSettings.success.match,
];

/** Gate polling on lock setup: while it's required the user never reaches the
 * lobby, so channels stay paused despite `startEventPolling`. `requested` tracks
 * intent separately from the gate so polling auto-resumes once setup completes. */
export default function* watcher(options: RootSagaOptions, worker = eventsWorker): Generator {
    let requested = false;
    let task: MaybeNull<Task> = null;

    while (true) {
        const action = (yield take(EVENT_POLLING_TRIGGERS)) as Action;

        if (startEventPolling.match(action)) requested = true;
        else if (stopEventPolling.match(action)) requested = false;

        const lockSetupRequired = (yield select(selectLockSetupRequired)) as boolean;
        const shouldPoll = requested && !lockSetupRequired;

        if (shouldPoll && !task) {
            logger.info(`[ServerEvents] start polling all event channels`);
            task = (yield fork(worker, options)) as Task;
        } else if (!shouldPoll && task) {
            logger.info(`[ServerEvents] cancelling all event channels [${action.type}]`);
            yield cancel(task);
            task = null;
        }
    }
}
