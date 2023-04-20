import type { EventChannel as ReduxSagaChannel } from 'redux-saga';

import type { Api, ApiOptions, ChannelType, ServerEvent } from '@proton/pass/types';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

export type EventChannelOnEvent<T extends ChannelType, O> = (
    event: ServerEvent<T>,
    self: EventChannel<T>,
    options: O
) => Generator;

export type EventChannelOnError<T extends ChannelType, O> = (
    error: unknown,
    self: EventChannel<T>,
    options: O
) => Generator;

type BaseConfig<T extends ChannelType, O> = {
    api: Api;
    eventID: string;
    interval: number;
    query?: (eventId: string) => ApiOptions<void, any, any, any>;
    mapEvent?: (managerEvent: any) => ServerEvent<T>;
    onClose?: () => void;
    onEvent: EventChannelOnEvent<T, O>;
    onError?: EventChannelOnError<T, O>;
};

export type EventChannelOptions<T extends ChannelType, O> = BaseConfig<T, O> &
    Extract<
        { type: ChannelType.USER } | { type: ChannelType.SHARES } | { type: ChannelType.SHARE; shareId: string },
        { type: T }
    >;

export type EventChannel<T extends ChannelType = any, O = any> = EventChannelOptions<T, O> & {
    manager: EventManager;
    channel: ReduxSagaChannel<ServerEvent<T>>;
};
