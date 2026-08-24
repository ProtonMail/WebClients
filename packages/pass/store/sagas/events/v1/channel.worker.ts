import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { call, cancel, cancelled, fork, put, select, take, takeLeading } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { ACTIVE_POLLING_TIMEOUT } from '../../../../lib/events/constants';
import type { EventManagerEvent } from '../../../../lib/events/manager';
import type { Maybe } from '../../../../types';
import { logger } from '../../../../utils/logger';
import { epochToMs, msToEpoch } from '../../../../utils/time/epoch';
import { channelAcknowledge, clientInit } from '../../../actions';
import { forcePollV1 } from '../../../actions/creators/polling';
import { channelRequest } from '../../../actions/requests';
import type { RequestEntry } from '../../../request/types';
import { selectRequest } from '../../../selectors';
import type { RootSagaOptions } from '../../../types';
import type { EventChannel } from './types';

/** Processes events from an event channel with error handling.
 * Closes channel on cancellation for proper cleanup. */
export function* channelEvents<T extends {}>(eventChannel: EventChannel<T>, options: RootSagaOptions): Generator {
    const { channel, onEvent, onError, manager } = eventChannel;

    try {
        while (true) {
            try {
                manager.setInterval(options.getPollingInterval());
                const event = (yield take(channel)) as EventManagerEvent<T>;
                yield call(onEvent, event, eventChannel, options);
                yield put(channelAcknowledge(channelRequest(eventChannel.channelId)));
            } catch (error: unknown) {
                logger.warn(`[Saga::Events] received an event error`, error);
                if (onError) yield call(onError, error, eventChannel, options);
            }
        }
    } finally {
        if (yield cancelled()) channel.close();
    }
}

export function* channelInitalize<T extends {}>({ manager, channelId }: EventChannel<T>, options: RootSagaOptions): Generator {
    /** Initializes polling with smart delay for service worker context.
     * Prevents immediate polling for background service workers by
     * calculating delay from last poll timestamp. Falls back to
     * immediate polling if `getPollingDelay` not configured */
    const initTask = (yield fork(function* () {
        const request: Maybe<RequestEntry<'success'>> = yield select(selectRequest(channelRequest(channelId)));
        const interval = msToEpoch(options.getPollingInterval());
        const delay: number = options.getPollingDelay?.(interval, request?.requestedAt) ?? 0;

        yield wait(epochToMs(delay));
        yield manager.call().catch(noop);
    })) as Task;

    /** Handles manual polling triggers. Cancels any pending init
     * and executes poll immediately */
    yield fork(function* () {
        yield takeLeading(
            (action: Action) => forcePollV1.match(action) && action.payload === channelId,
            function* () {
                yield cancel(initTask);
                yield manager.call().catch(noop);
            }
        );
    });

    if (EXTENSION_BUILD) {
        /** Syncs data on popup activation for extension context.
         * Cancels delayed init, forces immediate poll, and applies
         * cooldown to prevent rapid re-polling on popup toggle */
        yield takeLeading(
            (action: Action) => clientInit.intent.match(action) && action.meta.receiver.endpoint === 'popup',
            function* () {
                yield cancel(initTask);
                manager.setInterval(ACTIVE_POLLING_TIMEOUT);
                yield manager.call().catch(noop);
                yield wait(ACTIVE_POLLING_TIMEOUT);
            }
        );
    }
}
