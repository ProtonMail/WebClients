import { MailImportFields } from '@proton/activation/src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

type ImporterContact = {
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
