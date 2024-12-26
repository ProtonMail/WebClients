import { type EventLoop, serverEvent } from '@proton/account/eventLoop';

export const getServerEvent = (diff: Partial<Omit<EventLoop, 'More' | 'EventID'>>): ReturnType<typeof serverEvent> => {
    return serverEvent({
        ...diff,
        More: 0,
        EventID: '',
    });
};
