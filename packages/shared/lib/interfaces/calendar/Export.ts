import { Calendar } from './Calendar';
import { WeekStartsOn } from '../../date-fns-utc/interface';

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
    calendar: Calendar;
    exportErrors: ExportError[];
    error?: EXPORT_ERRORS;
    weekStartsOn: WeekStartsOn;
}
