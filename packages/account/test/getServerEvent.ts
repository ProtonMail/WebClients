import { type EventLoop, serverEvent } from '../eventLoop';

export const getServerEvent = (diff: Partial<Omit<EventLoop, 'More' | 'EventID'>>): ReturnType<typeof serverEvent> => {
    return serverEvent({
        ...diff,
        More: 0,
        EventID: '',
    });
};
