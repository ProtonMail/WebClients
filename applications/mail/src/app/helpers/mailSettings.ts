import { VIEW_LAYOUT, VIEW_MODE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

interface MailSettings {
    ViewLayout?: number;
    ViewMode?: number;
}

export const isColumnMode = ({ ViewLayout = VIEW_LAYOUT.COLUMN }: MailSettings = {}) =>
    ViewLayout === VIEW_LAYOUT.COLUMN;

export const isConversationMode = (labelID = '', { ViewMode = VIEW_MODE.GROUP }: MailSettings = {}) => {
    const alwaysMessageLabels = [
        MAILBOX_LABEL_IDS.DRAFTS,
        MAILBOX_LABEL_IDS.ALL_DRAFTS,
        MAILBOX_LABEL_IDS.SENT,
        MAILBOX_LABEL_IDS.ALL_SENT
    ];

    return !alwaysMessageLabels.includes(labelID as MAILBOX_LABEL_IDS) && ViewMode === VIEW_MODE.GROUP;
};
