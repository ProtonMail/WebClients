import type { EventLoop } from '@proton/redux-shared-store-types/eventLoop';

import { serverEvent } from '../eventLoop';

export const getServerEvent = (diff: Partial<Omit<EventLoop, 'More' | 'EventID'>>): ReturnType<typeof serverEvent> => {
    return serverEvent({
        ...diff,
        More: 0,
        EventID: '',
    });
};
