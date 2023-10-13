/* eslint-disable curly, @typescript-eslint/no-throw-literal */
import type { AnyAction } from 'redux';
import type { Task } from 'redux-saga';
import { all, cancel, fork, take } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import {
    boot,
    bootSuccess,
    signoutSuccess,
    startEventPolling,
    stateDestroy,
    stateLock,
    stopEventPolling,
    syncFailure,
    syncIntent,
    syncSuccess,
} from '../../actions';
import { invitesChannel } from './channel.invites';
import { shareChannels } from './channel.share';
import { sharesChannel } from './channel.shares';
import { userChannel } from './channel.user';

function* eventsWorker(options: WorkerRootSagaOptions): Generator {
    yield all([userChannel, shareChannels, sharesChannel, invitesChannel].map((effect) => fork(effect, api, options)));
}

const startPollingActions = or(startEventPolling.match, bootSuccess.match, syncSuccess.match, syncFailure.match);

const cancelPollingActions = or(
    stopEventPolling.match,
    boot.match,
    signoutSuccess.match,
    stateLock.match,
    syncIntent.match,
    stateDestroy.match
);

export default function* watcher(options: WorkerRootSagaOptions): Generator {
    while (yield take(startPollingActions)) {
        logger.info(`[Saga::Events] start polling all event channels`);
        const events = (yield fork(eventsWorker, options)) as Task;
        const action = (yield take(cancelPollingActions)) as AnyAction;
        logger.info(`[Saga::Events] cancelling all event channels [${action.type}]`);
        yield cancel(events);
    }
}
