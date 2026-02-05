import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, call, cancel, fork, select, take } from 'redux-saga/effects';

import { SYNC_VERSION } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { lockCreateSuccess, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { selectFeatureFlag, selectLockSetupRequired, selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Api, MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { UserPassPlan } from '@proton/pass/types/api/plan';
import { logger } from '@proton/pass/utils/logger';

import { groupInvitesChannel } from './channel.group-invites';
import { invitesChannel } from './channel.invites';
import { shareChannels } from './channel.share';
import { sharesChannel } from './channel.shares';
import { userChannel } from './channel.user';

type EventChannel = (api: Api, options: RootSagaOptions) => Generator;

/** Switch event channel polling mechanism depending on `SYNC_VERSION`.
 * For legacy V1: standard shares, invites polling
 * For modern V2: leverage new user events processor */
function* getEventChannels(): Generator<unknown, EventChannel[]> {
    switch (SYNC_VERSION) {
        case 1:
            const channels = [userChannel, shareChannels, sharesChannel, invitesChannel];

            /** Loading group invites is only needed if the user is a group owner
             * Fetching every group members list to define if the user is group owner would be too long
             * But we can limit at the plan to be b2b and having at least one group */
            const passPlan: UserPassPlan = yield select(selectPassPlan);
            const groupShareFeature: boolean = yield select(selectFeatureFlag(PassFeature.PassGroupInvitesV1));
            const b2b = isBusinessPlan(passPlan);
            const loadGroupInvites = groupShareFeature && b2b;

            if (loadGroupInvites) channels.push(groupInvitesChannel);
            return channels;

        case 2:
            return [userChannel];
    }
}

function* eventsWorker(options: RootSagaOptions): Generator {
    const channels: EventChannel[] = yield call(getEventChannels);
    logger.info(`[ServerEvents] Creating polling channels [version=${SYNC_VERSION}]`);
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
