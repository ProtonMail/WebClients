import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, cancel, fork, select, take } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { groupInvitesChannel } from '@proton/pass/store/sagas/events/channel.group-invites';
import { selectFeatureFlag, selectOrganizationGroups, selectPassPlan } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { UserPassPlan } from '@proton/pass/types/api/plan';
import { logger } from '@proton/pass/utils/logger';
import type { Group } from '@proton/shared/lib/interfaces';

import { invitesChannel } from './channel.invites';
import { shareChannels } from './channel.share';
import { sharesChannel } from './channel.shares';
import { userChannel } from './channel.user';

function* eventsWorker(options: RootSagaOptions): Generator {
    const passPlan: UserPassPlan = yield select(selectPassPlan);
    const groups: MaybeNull<Group[]> = yield select(selectOrganizationGroups);
    const groupShareFeature: boolean = yield select(selectFeatureFlag(PassFeature.PassGroupInvitesV1));
    const b2b = isBusinessPlan(passPlan);

    /** Loading group invites is only needed if the user is a group owner
     * Fetching every group members list to define if the user is group owner would be too long
     * But we can limit at the plan to be b2b and having at least one group */
    const loadGroupInvites = groupShareFeature && b2b && !!groups?.length;

    yield all(
        [userChannel, shareChannels, sharesChannel, invitesChannel, ...(loadGroupInvites ? [groupInvitesChannel] : [])].map((effect) =>
            fork(effect, api, options)
        )
    );
}

export default function* watcher(options: RootSagaOptions): Generator {
    while (yield take(startEventPolling.match)) {
        logger.info(`[ServerEvents] start polling all event channels`);
        const events = (yield fork(eventsWorker, options)) as Task;
        const action = (yield take(stopEventPolling.match)) as Action;
        logger.info(`[ServerEvents] cancelling all event channels [${action.type}]`);
        yield cancel(events);
    }
}
