import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { MailImportFields } from '../../../components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import type { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../interface';

type ImporterContact = {
    error?: string;
};

type ImporterDrive = {
    error?: string;
};

export type ImporterCalendar = {
    source: string;
    description: string;
    id: string;
    checked: boolean;
    error?: string;
    newCalendar?: boolean;
    mergedTo?: VisualCalendar;
};
export type ImporterData = {
    importerId: string;
    importedEmail: string;
    emails?: { error?: string; fields?: MailImportFields; readonly initialFields?: MailImportFields };
    calendars?: { error?: string; calendars?: ImporterCalendar[]; readonly initialFields?: ImporterCalendar[] };
    contacts?: ImporterContact;
    drive?: ImporterDrive;
};

export type MailImportState = {
    step?: 'products' | 'instructions' | 'loading-importer' | 'prepare-import' | 'importing' | 'success';
    products?: ImportType[];
    hasReadInstructions?: boolean;
    isCreatingImporter?: boolean;
    scopes?: string[];
    importerData?: ImporterData;
};

export type OauthDraftState = {
    step: 'idle' | 'started';
    provider?: ImportProvider;
    displayConfirmLeaveModal?: boolean;
    mailImport?: MailImportState;
    source?: EASY_SWITCH_SOURCES;
};
