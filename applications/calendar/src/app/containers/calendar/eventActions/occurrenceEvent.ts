import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getDateOrDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsIcalPropertyAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import { addDays } from 'proton-shared/lib/date-fns-utc';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';

// Merge the start and end of the occurrence into the dtstart and dtend of the original event component
const withOccurrenceEvent = (vevent: VcalVeventComponent, recurring: CalendarEventRecurring): VcalVeventComponent => {
    // Add the non-inclusive end for all day events...
    const safeEnd = getIsIcalPropertyAllDay(vevent.dtend) ? addDays(recurring.localEnd, 1) : recurring.localEnd;
    return {
        ...vevent,
        dtstart: getDateOrDateTimeProperty(vevent.dtstart, recurring.localStart),
        dtend: getDateOrDateTimeProperty(vevent.dtend, safeEnd),
    };
};

export default withOccurrenceEvent;
