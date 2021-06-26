import { CALENDAR_CARD_TYPE } from '@proton/shared/lib/calendar/constants';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { unwrap } from '@proton/shared/lib/calendar/helper';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { SharedVcalVeventComponent } from '../interface';

const { CLEAR_TEXT, SIGNED } = CALENDAR_CARD_TYPE;

const getComponentFromCalendarEvent = (eventData: CalendarEvent): SharedVcalVeventComponent => {
    const unencryptedPart = eventData.SharedEvents.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
    if (!unencryptedPart) {
        throw new Error('Missing unencrypted part');
    }
    return parse(unwrap(unencryptedPart.Data)) as SharedVcalVeventComponent;
};

export default getComponentFromCalendarEvent;
