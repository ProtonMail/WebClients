/* eslint-disable curly, @typescript-eslint/no-throw-literal */
import type { AnyAction } from 'redux';
import type { Task } from 'redux-saga';
import { all, cancel, fork, take } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { logger } from '@proton/pass/utils/logger';

import { startEventPolling, stopEventPolling } from '../../actions';
import { invitesChannel } from './channel.invites';
import { shareChannels } from './channel.share';
import { sharesChannel } from './channel.shares';
import { userChannel } from './channel.user';

function* eventsWorker(options: WorkerRootSagaOptions): Generator {
    yield all([userChannel, shareChannels, sharesChannel, invitesChannel].map((effect) => fork(effect, api, options)));
}

export default function* watcher(options: WorkerRootSagaOptions): Generator {
    while (yield take(startEventPolling.match)) {
        logger.info(`[Saga::Events] start polling all event channels`);
        const events = (yield fork(eventsWorker, options)) as Task;
        const action = (yield take(stopEventPolling.match)) as AnyAction;
        logger.info(`[Saga::Events] cancelling all event channels [${action.type}]`);
        yield cancel(events);
    }
}
