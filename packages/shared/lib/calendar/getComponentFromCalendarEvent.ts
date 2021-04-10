import { CALENDAR_CARD_TYPE } from './constants';
import { CalendarEvent, SharedVcalVeventComponent } from '../interfaces/calendar';
import { unwrap } from './helper';
import { parse } from './vcal';

const { CLEAR_TEXT, SIGNED } = CALENDAR_CARD_TYPE;

const getComponentFromCalendarEvent = (eventData: CalendarEvent): SharedVcalVeventComponent => {
    const unencryptedPart = eventData.SharedEvents.find(({ Type }) => [CLEAR_TEXT, SIGNED].includes(Type));
    if (!unencryptedPart) {
        throw new Error('Missing unencrypted part');
    }
    return parse(unwrap(unencryptedPart.Data)) as SharedVcalVeventComponent;
};

export default getComponentFromCalendarEvent;
