import { formatData } from 'proton-shared/lib/calendar/serialize';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { VcalCalendarComponent, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { ReactNode } from 'react';
import { ImportEventError } from '../components/import/ImportEventError';
import { ImportEventGeneralError } from '../components/import/ImportEventGeneralError';
import { ImportFileError } from '../components/import/ImportFileError';
import { ImportFatalError } from '../components/import/ImportFatalError';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    WARNING,
    IMPORTING,
    FINISHED,
}

export interface DetailError {
    index: number;
    message: ReactNode;
}

export interface EncryptedEvent {
    uid: string;
    data: ReturnType<typeof formatData>;
}

export interface ImportCalendarModel {
    step: IMPORT_STEPS;
    fileAttached?: File;
    eventsParsed: VcalVeventComponent[];
    eventsNotParsed: ImportEventError[];
    eventsEncrypted: EncryptedEvent[];
    eventsNotEncrypted: ImportEventError[];
    eventsImported: Pick<EncryptedEvent, 'uid'>[];
    eventsNotImported: ImportEventGeneralError[];
    failure?: ImportFatalError | ImportFileError | Error;
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

export type VcalCalendarComponentOrError = VcalCalendarComponent | { error: Error };
