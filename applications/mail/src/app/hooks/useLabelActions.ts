import { useFolders, useLabels } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { isCustomFolder, isCustomLabel } from '../helpers/labels';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT, STARRED, ALL_MAIL, SCHEDULED } =
    MAILBOX_LABEL_IDS;

type Actions = 'inbox' | 'trash' | 'delete' | 'archive' | 'spam' | 'nospam';

export const useLabelActions = (
    labelID: string,
    isNarrow: boolean
): [primaryActions: Actions[], secondaryActions: Actions[]] => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    let primaryActions: Actions[] = [];
    let secondaryActions: Actions[] = [];

    if (labelID === INBOX) {
        primaryActions = ['trash', 'archive', 'spam'];
    } else if (labelID === DRAFTS || labelID === ALL_DRAFTS) {
        primaryActions = ['trash', 'archive', 'delete'];
    } else if (labelID === SENT || labelID === ALL_SENT) {
        primaryActions = ['trash', 'archive', 'delete'];
    } else if (labelID === SCHEDULED) {
        primaryActions = ['trash', 'archive'];
    } else if (labelID === STARRED) {
        primaryActions = ['trash', 'archive', 'spam'];
    } else if (labelID === ARCHIVE) {
        primaryActions = ['trash', 'inbox', 'spam'];
    } else if (labelID === SPAM) {
        primaryActions = ['trash', 'nospam', 'delete'];
    } else if (labelID === TRASH) {
        primaryActions = ['inbox', 'archive', 'delete'];
    } else if (labelID === ALL_MAIL) {
        primaryActions = ['trash', 'archive', 'spam'];
    } else if (isCustomFolder(labelID, folders)) {
        primaryActions = ['trash', 'archive', 'spam'];
    } else if (isCustomLabel(labelID, labels)) {
        primaryActions = ['trash', 'archive', 'spam'];
    }

    if (isNarrow) {
        const [first, ...rest] = primaryActions;
        primaryActions = [first];
        secondaryActions = rest;
    }

    return [primaryActions, secondaryActions];
};
