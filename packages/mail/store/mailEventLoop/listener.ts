import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { filtersLoop } from '../filters/eventLoopV6';
import { forwardingsLoop } from '../forwarding/eventLoopV6';
import { labelsLoop } from '../labels/eventLoopV6';
import { mailSettingsLoop } from '../mailSettings/eventLoopV6';
import { mailEventLoopV6 } from './index';
import type { MailEventLoopV6Callback, MailEventLoopV6RequiredState } from './interface';

const loops: MailEventLoopV6Callback[] = [mailSettingsLoop, labelsLoop, filtersLoop, forwardingsLoop];
Object.freeze(loops);

export const mailEventLoopV6Listener = (startListening: SharedStartListening<MailEventLoopV6RequiredState>) => {
    startListening({
        actionCreator: mailEventLoopV6,
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
