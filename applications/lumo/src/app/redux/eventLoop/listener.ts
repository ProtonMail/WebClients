import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import type { AppStartListening } from '../store';
import { lumoEventLoop } from './index';
import { conversationsLoop } from './loops/conversations';
import { lumoUserSettingsLoop } from './loops/lumoUserSettings';
import { refreshLoop } from './loops/refresh';
import { spacesLoop } from './loops/spaces';

const loops = [refreshLoop, spacesLoop, conversationsLoop, lumoUserSettingsLoop];
Object.freeze(loops);

export const lumoEventLoopListener = (startListening: AppStartListening) => {
    startListening({
        actionCreator: lumoEventLoop,
        effect: async (action, { dispatch, getState, extra }) => {
            const state = getState();
            const promises = action.payload.promises;
            const event = action.payload.event;
            const api = getSilentApi(extra.api);

            loops.forEach((callback) => {
                const promise = callback({ event, state, dispatch, api });

                if (promise) {
                    promises.push(promise);
                }
            });
        },
    });
};
