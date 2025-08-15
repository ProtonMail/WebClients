import type { CalendarEventLoopV6Callback } from '../calendarEventLoop/interface';
import { calendarsEventLoopV6Thunk, selectCalendars } from './index';

export const calendarsLoop: CalendarEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Calendars?.length && selectCalendars(state)?.value) {
        return dispatch(calendarsEventLoopV6Thunk({ event, api }));
    }
};
