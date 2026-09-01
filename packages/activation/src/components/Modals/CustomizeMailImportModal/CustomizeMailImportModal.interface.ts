import type { IconComponent } from '@proton/icons/component';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcPaperPlane } from '@proton/icons/icons/IcPaperPlane';
import { IcStar } from '@proton/icons/icons/IcStar';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import type { Address, Label } from '@proton/shared/lib/interfaces';

import type { MailImportFolder } from '../../../helpers/MailImportFoldersParser/MailImportFoldersParser';
import type { MailImportPayloadError, TIME_PERIOD } from '../../../interface';
import { MailImportDestinationFolder } from '../../../interface';

export interface MailImportFields {
    mapping: MailImportFolder[];
    importLabel: Pick<Label, 'Color' | 'Name' | 'Type'>;
    importPeriod: TIME_PERIOD;
    importAddress: Address;
    importCategoriesDestination: MailImportDestinationFolder;
}

/** This module is a `.ts` file, so the icons are components rather than elements. */
export const FOLDER_ICONS: Record<MailImportDestinationFolder, IconComponent> = {
    [MailImportDestinationFolder.INBOX]: IcInbox,
    [MailImportDestinationFolder.ALL_DRAFTS]: IcFileLines,
    [MailImportDestinationFolder.ALL_SENT]: IcPaperPlane,
    [MailImportDestinationFolder.TRASH]: IcTrash,
    [MailImportDestinationFolder.SPAM]: IcFire,
    [MailImportDestinationFolder.ARCHIVE]: IcArchiveBox,
    [MailImportDestinationFolder.SENT]: IcPaperPlane,
    [MailImportDestinationFolder.DRAFTS]: IcFileLines,
    [MailImportDestinationFolder.STARRED]: IcStar,
    [MailImportDestinationFolder.ALL_MAIL]: IcEnvelopes,
    [MailImportDestinationFolder.ALMOST_ALL_MAIL]: IcEnvelopes,
};

export interface FolderMapItem extends MailImportFolder {
    disabled: boolean;
    errors: MailImportPayloadError[];
    isLabel: boolean;
}
