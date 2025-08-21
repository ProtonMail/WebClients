import { CALENDAR_CARD_TYPE } from '@proton/shared/lib/calendar/constants';
import { unwrap } from '@proton/shared/lib/calendar/helper';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarVcalVeventComponent, SharedVcalVeventComponent } from '../interface';

const getComponentFromCalendarEventUnencryptedPart = (eventData: CalendarEvent): SharedVcalVeventComponent => {
    const unencryptedSharedPart = eventData.SharedEvents.find(({ Type }) =>
        [CALENDAR_CARD_TYPE.CLEAR_TEXT, CALENDAR_CARD_TYPE.SIGNED].includes(Type)
    );
    if (!unencryptedSharedPart) {
        throw new Error('Missing unencrypted shared part');
    }
    const unencryptedCalendarPart = eventData.CalendarEvents.find(({ Type }) =>
        [CALENDAR_CARD_TYPE.CLEAR_TEXT, CALENDAR_CARD_TYPE.SIGNED].includes(Type)
    );
    try {
        const sharedEvent = parse(unwrap(unencryptedSharedPart.Data)) as SharedVcalVeventComponent;
        const calendarEvent = unencryptedCalendarPart
            ? (parse(unwrap(unencryptedCalendarPart.Data)) as CalendarVcalVeventComponent)
            : {};

        return {
            ...sharedEvent,
            ...calendarEvent,
        };
    } catch (e: any) {
        /**
         * We should always be able to parse events in the DB. If we can't that's bad, and we want to find out as soon as possible.
         * For that we log the error to Sentry. The log includes the problematic ics card. It's ok to log it since it's not encrypted.
         */
        captureMessage('Unparseable clear part of calendar event', {
            level: 'info',
            extra: {
                sharedIcs: unencryptedSharedPart.Data,
                calendarIcs: unencryptedCalendarPart?.Data,
            },
        });
        if (e instanceof Error) {
            throw e;
        }
        throw new Error('Unparseable unencrypted part of calendar event');
    }
};

export default getComponentFromCalendarEventUnencryptedPart;
