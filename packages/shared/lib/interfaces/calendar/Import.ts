import { ImportEventError } from '../../calendar/import/ImportEventError';
import { ImportFatalError } from '../../calendar/import/ImportFatalError';
import { ImportFileError } from '../../calendar/import/ImportFileError';
import { RequireSome } from '../utils';
import { CalendarCreateEventBlobData } from './Api';
import { Calendar } from './Calendar';
import { SyncMultipleApiResponses } from './Event';
import { VcalCalendarComponent, VcalVeventComponent } from './VcalModel';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    WARNING,
    IMPORTING,
    FINISHED,
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

export type VcalCalendarComponentOrError = VcalCalendarComponent | { error: Error };

export interface EncryptedEvent {
    component: VcalVeventComponent;
    data: RequireSome<CalendarCreateEventBlobData, 'SharedEventContent' | 'SharedKeyPacket'>;
}

export interface StoredEncryptedEvent extends EncryptedEvent {
    response: SyncMultipleApiResponses;
}
