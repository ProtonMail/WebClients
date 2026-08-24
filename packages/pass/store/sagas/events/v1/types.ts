import type { EventChannel as ReduxSagaChannel } from 'redux-saga';

import type { EventManager, EventManagerConfig, EventManagerEvent } from '../../../../lib/events/manager';
import type { RootSagaOptions } from '../../../types';

export type EventChannelOnEvent<T extends {}> = (event: EventManagerEvent<T>, self: EventChannel<T>, options: RootSagaOptions) => Generator;

export type EventChannelOnError<T extends {}> = (error: unknown, self: EventChannel<T>, options: RootSagaOptions) => Generator;

export type EventChannelOptions<T extends {}> = EventManagerConfig<T> & {
    channelId: string;
    onClose?: () => void;
    onEvent: EventChannelOnEvent<T>;
    onError?: EventChannelOnError<T>;
};

export type EventChannel<T extends {}> = EventChannelOptions<T> & {
    channel: ReduxSagaChannel<EventManagerEvent<T>>;
    manager: EventManager<T>;
};
