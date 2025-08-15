import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import { contactEmailsLoop } from '../contactEmails/eventLoopV6';
import type { ContactEventLoopV6Callback, ContactEventLoopV6RequiredState } from '../contactEventLoop/interface';
import { contactsLoop } from '../contacts/eventLoopV6';
import { contactEventLoopV6 } from './index';

const loops: ContactEventLoopV6Callback[] = [contactsLoop, contactEmailsLoop];
Object.freeze(loops);

export const contactEventLoopV6Listener = (startListening: SharedStartListening<ContactEventLoopV6RequiredState>) => {
    startListening({
        actionCreator: contactEventLoopV6,
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
