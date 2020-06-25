import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { SharedVcalVeventComponent } from '../interface';

const getComponentFromCalendarEvent = (eventData: CalendarEvent): SharedVcalVeventComponent => {
    const signedPart = eventData.SharedEvents.find(({ Type }) => Type === 2);
    if (!signedPart) {
        throw new Error('Missing shared signed part');
    }
    return parse(unwrap(signedPart.Data)) as SharedVcalVeventComponent;
};

export default getComponentFromCalendarEvent;
