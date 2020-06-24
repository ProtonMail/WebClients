import { formatData } from 'proton-shared/lib/calendar/serialize';
import { Calendar, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { VcalCalendarComponent, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ImportEventError } from '../components/import/ImportEventError';
import { ImportFileError } from '../components/import/ImportFileError';
import { ImportFatalError } from '../components/import/ImportFatalError';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    WARNING,
    IMPORTING,
    FINISHED,
}

export interface EncryptedEvent {
    component: VcalVeventComponent;
    data: ReturnType<typeof formatData>;
}

export interface ImportCalendarModel {
    step: IMPORT_STEPS;
    fileAttached?: File;
    eventsParsed: VcalVeventComponent[];
    totalEncrypted: number;
    totalImported: number;
    errors: ImportEventError[];
    failure?: ImportFatalError | ImportFileError | Error;
    calendar: Calendar;
    loading: boolean;
}

export type Unwrap<T> = T extends Promise<infer U>
    ? U
    : T extends (...args: any) => Promise<infer U>
    ? U
    : T extends (...args: any) => infer U
    ? U
    : T;

export interface SyncMultipleApiResponses {
    Index: number;
    Response: {
        Code: number;
        Event?: CalendarEvent;
        Error?: string;
    };
}

export interface SyncMultipleApiResponse {
    Code: number;
    Responses: SyncMultipleApiResponses[];
}

export type VcalCalendarComponentOrError = VcalCalendarComponent | { error: Error };
