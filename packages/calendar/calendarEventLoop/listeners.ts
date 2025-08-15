import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

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

            loops.forEach((callback) => {
                const promise = callback({ event, state, dispatch, api });
                if (promise) {
                    promises.push(promise);
                }
            });
        },
    });
};
