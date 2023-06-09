import type { AnyAction } from 'redux';
import { call, cancelled, put, take, takeLeading } from 'redux-saga/effects';

import type { ChannelType, ServerEvent } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { serverEvent, wakeupSuccess } from '../../actions';
import type { WorkerRootSagaOptions } from '../../types';
import type { EventChannel } from './types';

/* generic worker over an EventChannel : responsible for polling
 * the underlying redux-saga event channel and triggering the
 * appropriate callback generators. Closes the channel if the
 * parent task is canceled */
export function* channelEventsWorker<T extends ChannelType>(
    eventChannel: EventChannel<T>,
    options: WorkerRootSagaOptions
): Generator {
    const { channel, onEvent, onError } = eventChannel;
    try {
        while (true) {
            try {
                const event = (yield take(channel)) as ServerEvent<T>;
                if (!event.error) yield put(serverEvent(event));
                yield call(onEvent, event, eventChannel, options);
            } catch (error: unknown) {
                logger.warn(`[Saga::Events] received an event error`, error);
                if (onError) yield call(onError, error, eventChannel, options);
            }
        }
    } finally {
        if (yield cancelled()) {
            channel.close();
        }
    }
}

/* This worker will call the event manager immediately and
 * on every wakeupSuccess action coming  from the pop-up in
 * in order to sync as quickly as possible. Take the leading
 * wakeup call in order to avoid unnecessary parallel calls */
export function* channelWakeupWorker<T extends ChannelType>({ manager, interval }: EventChannel<T>): Generator {
    yield manager.call().catch(noop);
    yield takeLeading(
        (action: AnyAction) => wakeupSuccess.match(action) && action.meta.receiver.endpoint === 'popup',
        function* () {
            yield manager.call().catch(noop);
            /* wait the channel's interval to process
             * the next wakeupSuccess in case user is
             * repeatedly opening the pop-up */
            yield wait(interval);
        }
    );
}
