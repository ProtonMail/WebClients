import type { ICAL_METHOD } from '../../calendar/constants';
import type { ImportEventError } from '../../calendar/icsSurgery/ImportEventError';
import type { ImportFatalError } from '../../calendar/import/ImportFatalError';
import type { ImportFileError } from '../../calendar/import/ImportFileError';
import type { CalendarCreateEventBlobData } from './Api';
import type { VisualCalendar } from './Calendar';
import type { SyncMultipleApiSuccessResponses } from './Event';
import type { VcalVeventComponent } from './VcalModel';

export enum IMPORT_STEPS {
    ATTACHING = 0,
    ATTACHED = 1,
    WARNING_IMPORT_INVITATION = 2,
    WARNING_PARTIAL_IMPORT = 3,
    IMPORTING = 4,
    FINISHED = 5,
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
