import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label, LabelCount } from '@proton/shared/lib/interfaces';

export const CUSTOM_LABEL_ID1 = 'custom-label-1';
export const CUSTOM_LABEL_ID2 = 'custom-label-2';
export const CUSTOM_FOLDER_ID1 = 'custom-folder-1';
export const CUSTOM_FOLDER_ID2 = 'custom-folder-2';

export const customLabels = [
    { ID: CUSTOM_LABEL_ID1, Name: 'Custom Label 1', Type: 1 } as Label,
    { ID: CUSTOM_LABEL_ID2, Name: 'Custom Label 2', Type: 1 } as Label,
];

export const customFolders = [
    { ID: CUSTOM_FOLDER_ID1, Name: 'Custom Folder 1', Type: 1 } as Folder,
    { ID: CUSTOM_FOLDER_ID2, Name: 'Custom Folder 2', Type: 1 } as Folder,
];

export const createDefaultCounters = () => [
    {
        LabelID: MAILBOX_LABEL_IDS.INBOX,
        Unread: 5,
        Total: 10,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
        Unread: 1,
        Total: 5,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.ALL_SENT,
        Unread: 1,
        Total: 5,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.TRASH,
        Unread: 1,
        Total: 5,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.SPAM,
        Unread: 1,
        Total: 5,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
        Unread: 12,
        Total: 34,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.STARRED,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.ARCHIVE,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.SENT,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.DRAFTS,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.SCHEDULED,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        Unread: 10,
        Total: 24,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.SNOOZED,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: CUSTOM_LABEL_ID1,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: CUSTOM_LABEL_ID2,
        Unread: 0,
        Total: 0,
    },
    {
        LabelID: CUSTOM_FOLDER_ID1,
        Unread: 1,
        Total: 2,
    },
    {
        LabelID: CUSTOM_FOLDER_ID2,
        Unread: 0,
        Total: 0,
    },
];

export const checkUpdatedCounters = ({
    updatedCounters,
    skippedLabelIDs,
}: {
    updatedCounters: LabelCount[];
    skippedLabelIDs: string[];
}) => {
    const defaultCounters = createDefaultCounters();

    for (const counter of defaultCounters) {
        if (skippedLabelIDs.includes(counter.LabelID)) {
            continue;
        }

        const updated = updatedCounters.find((c) => c.LabelID === counter.LabelID);
        expect(updated).toEqual(counter);
    }
};
