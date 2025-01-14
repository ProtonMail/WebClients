import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

// TODO Move all labels helpers in shared in another MR
export const LABEL_IDS_TO_HUMAN = {
    [MAILBOX_LABEL_IDS.INBOX]: 'inbox',
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: 'all-drafts',
    [MAILBOX_LABEL_IDS.ALL_SENT]: 'all-sent',
    [MAILBOX_LABEL_IDS.TRASH]: 'trash',
    [MAILBOX_LABEL_IDS.SPAM]: 'spam',
    [MAILBOX_LABEL_IDS.ALL_MAIL]: 'all-mail',
    [MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL]: 'almost-all-mail',
    [MAILBOX_LABEL_IDS.ARCHIVE]: 'archive',
    [MAILBOX_LABEL_IDS.SENT]: 'sent',
    [MAILBOX_LABEL_IDS.DRAFTS]: 'drafts',
    [MAILBOX_LABEL_IDS.STARRED]: 'starred',
    [MAILBOX_LABEL_IDS.OUTBOX]: 'outbox',
    [MAILBOX_LABEL_IDS.SCHEDULED]: 'scheduled',
    [MAILBOX_LABEL_IDS.SNOOZED]: 'snoozed',
};

export const getHumanLabelID = (labelID: string) => LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] || labelID;

export const getLabelName = (labelID: string) => {
    const humanLabel = getHumanLabelID(labelID);
    if (humanLabel !== labelID) {
        return humanLabel;
    }
    return 'custom';
};
