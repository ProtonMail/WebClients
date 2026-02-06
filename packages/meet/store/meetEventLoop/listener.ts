import type { MeetEventLoopCallback, MeetEventLoopRequiredState } from '@proton/meet/store/meetEventLoop/interface';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { meetingsLoop } from '../meetingsLoop';
import { meetEventLoop } from './index';

const loops: MeetEventLoopCallback[] = [meetingsLoop];
Object.freeze(loops);

export const meetEventLoopListener = (startListening: SharedStartListening<MeetEventLoopRequiredState>) => {
    startListening({
        actionCreator: meetEventLoop,
        effect: async (action, { dispatch, getState, extra }) => {
            const state = getState();
            const promises = action.payload.promises;
            const event = action.payload.event;
            const api = getSilentApi(extra.api);

            loops.forEach((callback) => {
                const promise = callback({ event, state, dispatch, api });

                if (promise) {
                    const wrappedPromise = promise.catch((error) => {
                        throw error;
                    });
                    promises.push(wrappedPromise);
                }
            });
        },
    });
};
