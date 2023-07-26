import type { EventChannel as ReduxSagaChannel } from 'redux-saga';

import type { EventManager, EventManagerConfig, EventManagerEvent } from '../../../events/manager';
import type { WorkerRootSagaOptions } from '../../types';

export type EventChannelOnEvent<T extends {}> = (
    event: EventManagerEvent<T>,
    self: EventChannel<T>,
    options: WorkerRootSagaOptions
) => Generator;

export type EventChannelOnError<T extends {}> = (
    error: unknown,
    self: EventChannel<T>,
    options: WorkerRootSagaOptions
) => Generator;

export type EventChannelOptions<T extends {}> = EventManagerConfig<T> & {
    onClose?: () => void;
    onEvent: EventChannelOnEvent<T>;
    onError?: EventChannelOnError<T>;
};

export type EventChannel<T extends {}> = EventChannelOptions<T> & {
    manager: EventManager<T>;
    channel: ReduxSagaChannel<EventManagerEvent<T>>;
};
