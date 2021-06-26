import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

export interface EventTargetData {
    calendarID: string;
    memberID: string;
    addressID: string;
}

export interface EventNewData extends EventTargetData {
    veventComponent: VcalVeventComponent;
}

export interface EventOldData extends EventTargetData {
    eventData: CalendarEvent;
    uid: string;
    mainVeventComponent: VcalVeventComponent;
    veventComponent?: VcalVeventComponent;
}
