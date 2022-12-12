import { WeekStartsOn } from '../../date-fns-utc/interface';
import { VisualCalendar } from './Calendar';

export enum EXPORT_STEPS {
    EXPORTING,
    FINISHED,
}

export enum EXPORT_ERRORS {
    NETWORK_ERROR,
}

export enum EXPORT_EVENT_ERROR_TYPES {
    DECRYPTION_ERROR,
    PASSWORD_RESET,
}

export type ExportError = [string, EXPORT_EVENT_ERROR_TYPES];

export interface ExportCalendarModel {
    step: EXPORT_STEPS;
    totalFetched: number;
    totalProcessed: number;
    totalToProcess: number;
    calendar: VisualCalendar;
    exportErrors: ExportError[];
    error?: EXPORT_ERRORS;
    weekStartsOn: WeekStartsOn;
}
