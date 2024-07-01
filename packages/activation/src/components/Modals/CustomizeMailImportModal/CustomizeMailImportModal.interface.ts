import { MailImportFolder } from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { MailImportDestinationFolder, MailImportPayloadError, TIME_PERIOD } from '@proton/activation/src/interface';
import { Address, Label } from '@proton/shared/lib/interfaces';

export interface MailImportFields {
    mapping: MailImportFolder[];
    importLabel: Pick<Label, 'Color' | 'Name' | 'Type'>;
    importPeriod: TIME_PERIOD;
    importAddress: Address;
    importCategoriesDestination: MailImportDestinationFolder;
}

export const FOLDER_ICONS = {
    [MailImportDestinationFolder.INBOX]: 'inbox',
    [MailImportDestinationFolder.ALL_DRAFTS]: 'file-lines',
    [MailImportDestinationFolder.ALL_SENT]: 'paper-plane',
    [MailImportDestinationFolder.TRASH]: 'trash',
    [MailImportDestinationFolder.SPAM]: 'fire',
    [MailImportDestinationFolder.ARCHIVE]: 'archive-box',
    [MailImportDestinationFolder.SENT]: 'paper-plane',
    [MailImportDestinationFolder.DRAFTS]: 'file-lines',
    [MailImportDestinationFolder.STARRED]: 'star',
    [MailImportDestinationFolder.ALL_MAIL]: 'envelopes',
    [MailImportDestinationFolder.ALMOST_ALL_MAIL]: 'envelopes',
} as const;

export interface FolderMapItem extends MailImportFolder {
    disabled: boolean;
    errors: MailImportPayloadError[];
    isLabel: boolean;
}
