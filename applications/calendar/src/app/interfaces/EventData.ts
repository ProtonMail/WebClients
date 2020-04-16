import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { VcalVeventComponent } from './VcalModel';

export interface EventTargetData {
    calendarID: string;
    memberID: string;
    addressID: string;
}

export interface EventNewData extends EventTargetData {
    veventComponent: VcalVeventComponent;
}

export interface EventOldData extends EventTargetData {
    Event: CalendarEvent;
    uid: string;
    mainVeventComponent: VcalVeventComponent;
    veventComponent?: VcalVeventComponent;
}
