import type { IconName } from '@proton/icons/types';
import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export interface UseMoveSystemFoldersProps {
    showScheduled: boolean;
    showSnoozed: boolean;
    showSoftDeletedFolder: boolean;
}

export enum SYSTEM_FOLDER_SECTION {
    MAIN = 1,
    MORE = 0,
}

export interface SystemFolderPayload {
    ID: MAILBOX_LABEL_IDS;
    Order: number;
    Display: SYSTEM_FOLDER_SECTION;
    /** Mandatory for "update" api call */
    Color: string;
    /** Mandatory for "update" api call */
    Name: string;
}

export interface BaseSystemFolder {
    labelID: MAILBOX_LABEL_IDS;
    ID: string;
    icon: IconName;
    text: string;
    shortcutText?: string;
    visible: boolean;
    order: number;
    display: SYSTEM_FOLDER_SECTION;
}

export interface SystemFolder extends BaseSystemFolder {
    /** Mandatory fields for api calls */
    payloadExtras: {
        Name: SystemFolderPayload['Color'];
        Color: SystemFolderPayload['Name'];
    };
}
