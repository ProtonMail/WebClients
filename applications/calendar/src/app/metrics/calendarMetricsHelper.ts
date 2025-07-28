import { FREQUENCY, VIEWS } from '@proton/shared/lib/calendar/constants';

import type { CalendarViewEventTemporaryEvent } from '../containers/calendar/interface';

export const getNESTData = (temporaryEvent: CalendarViewEventTemporaryEvent) => {
    return {
        isRecurring: temporaryEvent.tmpData.frequencyModel.frequency !== FREQUENCY.ONCE,
        hasInvitees: temporaryEvent.tmpData.attendees.length > 0,
        hasConferenceData: !!temporaryEvent.tmpData.conferenceId && !!temporaryEvent.tmpData.conferenceUrl,
    };
};

export const convertViewToString = (view: VIEWS) => {
    switch (view) {
        case VIEWS.DAY:
            return 'day-view';
        case VIEWS.WEEK:
            return 'week-view';
        case VIEWS.MONTH:
            return 'month-view';
        case VIEWS.SEARCH:
            return 'search-view';
        default:
            return 'custom';
    }
};
