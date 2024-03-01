import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

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
