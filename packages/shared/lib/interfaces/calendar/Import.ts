import { ImportFatalError } from '../../calendar/import/ImportFatalError';
import { ImportFileError } from '../../calendar/import/ImportFileError';
import { VcalCalendarComponent, VcalVeventComponent } from './VcalModel';
import { ImportEventError } from '../../calendar/import/ImportEventError';
import { Calendar } from './Calendar';

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
