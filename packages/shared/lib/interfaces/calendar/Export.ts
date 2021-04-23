import { Calendar } from './Calendar';
import { VcalVeventComponent } from './VcalModel';
import { CalendarEvent } from './Event';

export enum EXPORT_STEPS {
    EXPORTING,
    FINISHED,
}

export enum EXPORT_ERRORS {
    NETWORK_ERROR,
}

export interface ExportCalendarModel {
    step: EXPORT_STEPS;
    totalProcessed: VcalVeventComponent[];
    totalToProcess: number;
    calendar: Calendar;
    erroredEvents: CalendarEvent[];
    error?: EXPORT_ERRORS;
}
