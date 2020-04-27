import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

export interface EventPersonalMap {
    [memberID: string]: VcalVeventComponent;
}
