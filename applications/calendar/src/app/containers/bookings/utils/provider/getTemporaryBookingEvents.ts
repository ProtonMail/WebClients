import {
    END_TYPE,
    EVENT_VERIFICATION_STATUS,
    FREQUENCY,
    ICAL_EVENT_STATUS,
    NOTIFICATION_UNITS,
    NOTIFICATION_WHEN,
} from '@proton/shared/lib/calendar/constants';
import type { EventModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarViewEvent } from '../../../calendar/interface';

// For booking we need to build a fake temporary event.
// Do not use this helper in another context
export const getTemporaryBookingEvents = (
    event: CalendarViewEvent,
    start: Date,
    end: Date,
    tzid: string
): EventModel => {
    return {
        type: 'event',
        calendar: event.data.calendarData as any,
        calendars: [],
        member: { memberID: '', addressID: '' },
        isAllDay: event.isAllDay,
        start: { date: start, time: start, tzid },
        end: { date: end, time: end, tzid },
        frequencyModel: {
            type: FREQUENCY.ONCE,
            frequency: FREQUENCY.ONCE,
            ends: { type: END_TYPE.NEVER },
        } as FrequencyModel,
        title: '',
        location: '',
        description: '',
        attendees: [],
        isOrganizer: false,
        isAttendee: false,
        isProtonProtonInvite: false,
        hasDefaultNotifications: false,
        status: ICAL_EVENT_STATUS.CONFIRMED,
        verificationStatus: EVENT_VERIFICATION_STATUS.NOT_VERIFIED,
        defaultPartDayNotification: {
            id: '',
            type: 0,
            value: 0,
            isAllDay: false,
            unit: NOTIFICATION_UNITS.DAY,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(),
        },
        defaultFullDayNotification: {
            id: '',
            type: 0,
            value: 0,
            isAllDay: true,
            unit: NOTIFICATION_UNITS.DAY,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(),
        },
        fullDayNotifications: [],
        partDayNotifications: [],
        initialDate: start,
        initialTzid: tzid,
        defaultEventDuration: 30,
        hasTouchedRrule: false,
        hasPartDayDefaultNotifications: false,
        hasFullDayDefaultNotifications: false,
    };
};
