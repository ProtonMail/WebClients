import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, call, cancel, fork, select, take } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { SYNC_STRATEGY } from '@proton/pass/lib/events/global';
import { SyncStrategy } from '@proton/pass/lib/events/types';
import { lockCreateSuccess, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { selectLockSetupRequired } from '@proton/pass/store/selectors';
import { selectLoadGroupInvites } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { groupInvitesChannel } from './v1/channel.group-invites';
import { invitesChannel } from './v1/channel.invites';
import { shareChannels } from './v1/channel.share';
import { sharesChannel } from './v1/channel.shares';
import { userChannel } from './v1/channel.user';
import { userEventsChannel } from './v2/channel.user-events';

type EventChannel = (api: Api, options: RootSagaOptions) => Generator;

/** Switch event channel polling mechanism depending on `SYNC_STRATEGY`.
 * For legacy V1: standard shares, invites polling
 * For modern V2: leverage new user events processor */
function* getEventChannels(): Generator<unknown, EventChannel[]> {
    switch (SYNC_STRATEGY) {
        case SyncStrategy.LEGACY:
            const channels = [userChannel, shareChannels, sharesChannel, invitesChannel];
            const loadGroupInvites: boolean = yield select(selectLoadGroupInvites);
            if (loadGroupInvites) channels.push(groupInvitesChannel);

            return channels;

        case SyncStrategy.USER_EVENTS:
            return [userChannel, userEventsChannel];
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
