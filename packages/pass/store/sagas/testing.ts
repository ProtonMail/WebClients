import type { RunSagaOptions } from 'redux-saga';
import { stdChannel } from 'redux-saga';

import { wait } from '@proton/shared/lib/helpers/promise';

export const sagaSetup = (state: unknown = {}) => {
    const dispatched: unknown[] = [];
    const nextTick = () => wait(0);
    const channel = stdChannel();

    return {
        nextTick,
        dispatched,
        channel,
        options: {
            channel,
            dispatch: (action: any) => {
                dispatched.push(action);
                channel.put(action);
            },
            getState: () => state,
        } satisfies RunSagaOptions<unknown, unknown>,
    };
};
