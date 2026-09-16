import type { WeekStartsOn } from '../../date-fns-utc/interface';
import type { VisualCalendar } from './Calendar';

export enum EXPORT_STEPS {
    EXPORTING = 0,
    FINISHED = 1,
}

export enum EXPORT_ERRORS {
    NETWORK_ERROR = 0,
}

export enum EXPORT_EVENT_ERROR_TYPES {
    DECRYPTION_ERROR = 0,
    PASSWORD_RESET = 1,
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
