import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { eventLoopTimingTracker } from '@proton/shared/lib/metrics/eventLoopMetrics';

import { calendarsLoop } from '../calendars/eventLoopV6';
import { calendarEventLoopV6 } from './index';
import type { CalendarEventLoopV6Callback, CalendarEventLoopV6RequiredState } from './interface';

const loops: CalendarEventLoopV6Callback[] = [calendarsLoop];
Object.freeze(loops);

export const calendarEventLoopV6Listener = (startListening: SharedStartListening<CalendarEventLoopV6RequiredState>) => {
    startListening({
        actionCreator: calendarEventLoopV6,
        effect: async (action, { dispatch, getState, extra }) => {
            const state = getState();
            const promises = action.payload.promises;
            const event = action.payload.event;
            const api = getSilentApi(extra.api);

            eventLoopTimingTracker.startV6Processing('calendar');

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
                eventLoopTimingTracker.endV6Processing(event.More, apiCallsCount, 'calendar', apiFailuresCount);
            });
        },
    });
};
