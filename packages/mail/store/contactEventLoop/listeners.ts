import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { eventLoopTimingTracker } from '@proton/shared/lib/metrics/eventLoopMetrics';

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

            eventLoopTimingTracker.startV6Processing('contact');

            let apiCallsCount = 0;
            let apiFailuresCount = 0;

            loops.forEach((callback) => {
                const promise = callback({ event, state, dispatch, api });

                if (promise) {
                    // Wrap the promise to count failures
                    const wrappedPromise = promise.catch((error) => {
                        apiFailuresCount++;
                        throw error; // Re-throw to maintain original behavior
                    });
                    promises.push(wrappedPromise);
                    apiCallsCount++;
                }
            });

            void Promise.all(promises).finally(() => {
                eventLoopTimingTracker.endV6Processing(event.More, apiCallsCount, 'contact', apiFailuresCount);
            });
        },
    });
};
