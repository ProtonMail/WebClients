/* eslint-disable curly */
import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { all, cancel, fork, take } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { logger } from '@proton/pass/utils/logger';

import { invitesChannel } from './channel.invites';
import { shareChannels } from './channel.share';
import { sharesChannel } from './channel.shares';
import { userChannel } from './channel.user';

function* eventsWorker(options: RootSagaOptions): Generator {
    yield all([userChannel, shareChannels, sharesChannel, invitesChannel].map((effect) => fork(effect, api, options)));
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
