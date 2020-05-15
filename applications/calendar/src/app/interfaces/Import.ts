import { ReactNode } from 'react';
import { formatData } from 'proton-shared/lib/calendar/serialize';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ImportFatalError, ImportFileError } from '../components/import/ImportFileError';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    WARNING,
    IMPORTING,
    FINISHED
}

export enum IMPORT_ERROR_TYPE {
    NO_FILE_SELECTED,
    NO_ICS_FILE,
    FILE_EMPTY,
    FILE_TOO_BIG,
    FILE_CORRUPTED,
    INVALID_CALENDAR,
    NO_EVENTS,
    TOO_MANY_EVENTS
}

export interface DetailError {
    index: number;
    message: ReactNode;
}

export interface EventFailure {
    idMessage: string;
    errorMessage: string;
}

export interface EncryptedEvent {
    uid: string;
    data: ReturnType<typeof formatData>;
}

export interface ImportCalendarModel {
    step: IMPORT_STEPS;
    fileAttached?: File;
    eventsParsed: VcalVeventComponent[];
    eventsNotParsed: EventFailure[];
    eventsEncrypted: EncryptedEvent[];
    eventsNotEncrypted: EventFailure[];
    eventsImported: Pick<EncryptedEvent, 'uid'>[];
    eventsNotImported: EventFailure[];
    failure?: ImportFileError | ImportFatalError | Error;
    calendar: Calendar;
}

export type Unwrap<T> = T extends Promise<infer U>
    ? U
    : T extends (...args: any) => Promise<infer U>
    ? U
    : T extends (...args: any) => infer U
    ? U
    : T;

export interface SyncMultipleApiResponse {
    Code: number;
    Responses: {
        Index: number;
        Response: {
            Code: number;
            Event?: object;
            Error?: string;
        };
    }[];
}
