import { MAILBOX_LABEL_IDS } from '../../constants';

// The sort order needs to be changed if the user is in the snoozed or inbox folder
export const getAppropriateSort = (LabelID?: string | string[], Sort?: string) => {
    return LabelID &&
        !Array.isArray(LabelID) &&
        [MAILBOX_LABEL_IDS.SNOOZED.toString(), MAILBOX_LABEL_IDS.INBOX.toString()].includes(LabelID)
        ? 'SnoozeTime'
        : Sort ?? 'Time';
};
