import { eventChannel } from 'redux-saga';

import type { ServerEvent } from '@proton/pass/types';
import type { ChannelType } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import createEventManager, { type EventManager } from '@proton/shared/lib/eventManager/eventManager';
import identity from '@proton/utils/identity';

import type { WorkerRootSagaOptions } from '../../types';
import type { EventChannel, EventChannelOnError, EventChannelOptions } from './types';

const channelErrorHandler = <T extends ChannelType, O>(onError?: EventChannelOnError<T, O>) => {
    const wrappedOnError: EventChannelOnError<T, O> = function* (error, eventsChannel, options) {
        yield onError?.(error, eventsChannel, options);

        if (error instanceof Error && ['LockedSession', 'InactiveSession'].includes(error.name)) {
            eventsChannel.channel.close();
        }
    };

    return wrappedOnError;
};

export const eventChannelFactory = <T extends ChannelType = ChannelType, O = WorkerRootSagaOptions>(
    config: EventChannelOptions<T, O>
) => {
    const { type, onClose, onError, mapEvent = identity } = config;
    const manager: EventManager = createEventManager(config);

    return merge(config, {
        onError: channelErrorHandler<T, O>(onError),
        manager,
        channel: eventChannel<ServerEvent>((emitter) => {
            const unsubscribe = manager.subscribe((event) => emitter(mapEvent({ ...event, type })));

            return () => {
                onClose?.();
                unsubscribe();
                manager.stop();
                manager.reset();
            };
        }),
    }) as EventChannel<T>;
};
