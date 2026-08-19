import type { MailImportFields } from '../../../components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import type { StepFormState } from '../../../components/Modals/Imap/ImapMailModal/StepForm/hooks/useStepForm.interface';
import type { MailImportFolder } from '../../../helpers/MailImportFoldersParser/MailImportFoldersParser';
import type { AuthenticationMethod, ImportProvider, ImportType } from '../../../interface';

export type MailImportState = {
    step: 'form' | 'reconnect-form' | 'prepare-import' | 'importing';
    loading?: boolean;
    apiErrorCode?: number;
    apiErrorLabel?: string;
    apiImporterID?: string;
    apiSasl?: AuthenticationMethod;
    domain?: StepFormState['imap'];
    email?: StepFormState['emailAddress'];
    fields?: MailImportFields;
    password?: StepFormState['password'];
    port?: StepFormState['port'];
    foldersMapping?: MailImportFolder[];
};

export type ImapDraftState = {
    step: 'idle' | 'started';
    provider?: ImportProvider;
    product?: ImportType;
    /** User can be asked to read an instructions modal */
    hasReadInstructions?: boolean;
    mailImport?: MailImportState;
    displayConfirmLeaveModal?: boolean;
};
