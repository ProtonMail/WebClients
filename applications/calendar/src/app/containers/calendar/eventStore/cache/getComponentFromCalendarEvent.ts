import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';

const getComponentFromCalendarEvent = (eventData: CalendarEvent) => {
    const signedPart = eventData.SharedEvents.find(({ Type }) => Type === 2);
    if (!signedPart) {
        throw new Error('Missing shared signed part');
    }
    return parse(unwrap(signedPart.Data)) as VcalVeventComponent;
};

export default getComponentFromCalendarEvent;
