import { ICAL_METHOD } from '../../calendar/constants';
import { ImportEventError } from '../../calendar/icsSurgery/ImportEventError';
import { ImportFatalError } from '../../calendar/import/ImportFatalError';
import { ImportFileError } from '../../calendar/import/ImportFileError';
import { CalendarCreateEventBlobData } from './Api';
import { VisualCalendar } from './Calendar';
import { SyncMultipleApiSuccessResponses } from './Event';
import { VcalVeventComponent } from './VcalModel';

export enum IMPORT_STEPS {
    ATTACHING,
    ATTACHED,
    WARNING_IMPORT_INVITATION,
    WARNING_PARTIAL_IMPORT,
    IMPORTING,
    FINISHED,
}

export interface ImportCalendarModel {
    step: IMPORT_STEPS;
    fileAttached?: File;
    method?: ICAL_METHOD;
    hashedIcs?: string;
    eventsParsed: VcalVeventComponent[];
    totalEncrypted: number;
    totalImported: number;
    visibleErrors: ImportEventError[];
    hiddenErrors: ImportEventError[];
    failure?: ImportFatalError | ImportFileError | Error;
    calendar: VisualCalendar;
    loading: boolean;
}

export interface EncryptedEvent {
    component: VcalVeventComponent;
    data: CalendarCreateEventBlobData;
}

export interface ImportedEvent extends EncryptedEvent {
    response: SyncMultipleApiSuccessResponses;
}
