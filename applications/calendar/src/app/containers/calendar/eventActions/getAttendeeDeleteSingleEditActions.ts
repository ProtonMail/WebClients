import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar/Event';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

export const getAttendeeDeleteSingleEditOperation = ({
    eventComponent,
    event,
    addressID,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    addressID: string;
}) => {
    return {
        data: {
            addressID,
            calendarID: event.CalendarID,
            eventID: event.ID,
            eventComponent,
        },
    };
};
