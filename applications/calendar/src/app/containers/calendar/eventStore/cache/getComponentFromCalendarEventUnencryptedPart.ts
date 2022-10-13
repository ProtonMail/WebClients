import { CALENDAR_CARD_TYPE } from '@proton/shared/lib/calendar/constants';
import { unwrap } from '@proton/shared/lib/calendar/helper';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import { SharedVcalVeventComponent } from '../interface';

const { CLEAR_TEXT, SIGNED } = CALENDAR_CARD_TYPE;

const getComponentFromCalendarEventUnencryptedPart = (eventData: CalendarEvent): SharedVcalVeventComponent => {
    const unencryptedPart = eventData.SharedEvents.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
    if (!unencryptedPart) {
        throw new Error('Missing unencrypted part');
    }
    try {
        return parse(unwrap(unencryptedPart.Data)) as SharedVcalVeventComponent;
    } catch (e: any) {
        /**
         * We should always be able to parse events in the DB. If we can't that's bad, and we want to find out as soon as possible.
         * For that we log the error to Sentry. The log includes the problematic ics card. It's ok to log it since it's not encrypted.
         */
        captureMessage('Unparseable clear part of calendar event', {
            level: 'info',
            extra: {
                ics: unencryptedPart.Data,
            },
        });
        if (e instanceof Error) {
            throw e;
        }
        throw new Error('Unparseable unencrypted part of calendar event');
    }
};

export default getComponentFromCalendarEventUnencryptedPart;
