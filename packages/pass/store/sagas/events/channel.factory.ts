import { eventChannel } from 'redux-saga';

import { merge } from '@proton/pass/utils/object/merge';

import { type EventManagerEvent, eventManager } from '../../../events/manager';
import type { EventChannel, EventChannelOnError, EventChannelOptions } from './types';

const channelErrorHandler = <T extends {}>(onError?: EventChannelOnError<T>) => {
    const wrappedOnError: EventChannelOnError<T> = function* (error, eventsChannel, options) {
        yield onError?.(error, eventsChannel, options);

        if (error instanceof Error && ['LockedSession', 'InactiveSession'].includes(error.name)) {
            eventsChannel.channel.close();
        }
    };

    return wrappedOnError;
};

export const eventChannelFactory = <T extends {}>(config: EventChannelOptions<T>) => {
    const { onClose, onError } = config;
    const manager = eventManager<T>(config);

    return merge(config, {
        onError: channelErrorHandler<T>(onError),
        manager,
        channel: eventChannel<EventManagerEvent<T>>((emitter) => {
            const unsubscribe = manager.subscribe(emitter);

            return () => {
                onClose?.();
                unsubscribe();
                manager.stop();
                manager.reset();
            };
        }),
    }) as EventChannel<T>;
};
