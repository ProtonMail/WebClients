import { MailImportFields } from '@proton/activation/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { StepFormState } from '@proton/activation/components/Modals/Imap/ImapMailModal/StepForm/hooks/useStepForm.interface';
import { MailImportFolder } from '@proton/activation/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { AuthenticationMethod, ImportType } from '@proton/activation/interface';
import { ImportProvider } from '@proton/activation/interface';

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
