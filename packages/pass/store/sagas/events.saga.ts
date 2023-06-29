/* eslint-disable curly, @typescript-eslint/no-throw-literal */
import type { AnyAction } from 'redux';
import type { Task } from 'redux-saga';
import { all, cancel, fork, take } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { or } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';

import {
    boot,
    bootSuccess,
    importItemsFailure,
    importItemsIntent,
    importItemsSuccess,
    signoutSuccess,
    stateDestroy,
    stateLock,
    syncFailure,
    syncIntent,
    syncSuccess,
} from '../actions';
import type { WorkerRootSagaOptions } from '../types';
import { shareChannels } from './events/channel.share';
import { sharesChannel } from './events/channel.shares';
import { userChannel } from './events/channel.user';

function* eventsWorker(options: WorkerRootSagaOptions): Generator {
    yield all([userChannel, shareChannels, sharesChannel].map((effect) => fork(effect, api, options)));
}

const startPollingActions = or(
    bootSuccess.match,
    syncSuccess.match,
    syncFailure.match,
    importItemsSuccess.match,
    importItemsFailure.match
);

const cancelPollingActions = or(
    boot.match,
    signoutSuccess.match,
    stateLock.match,
    syncIntent.match,
    stateDestroy.match,
    importItemsIntent.match
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
