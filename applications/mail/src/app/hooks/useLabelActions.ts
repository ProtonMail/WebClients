import { isCustomFolder, isCustomLabel } from '@proton/mail/helpers/location';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';

type Actions = 'inbox' | 'trash' | 'delete' | 'archive' | 'spam' | 'nospam';

export const useLabelActions = (labelID: string): [primaryActions: Actions[], secondaryActions: Actions[]] => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    let primaryActions: Actions[] = [];
    const secondaryActions: Actions[] = [];

    switch (labelID) {
        case MAILBOX_LABEL_IDS.INBOX:
        case MAILBOX_LABEL_IDS.STARRED:
        case MAILBOX_LABEL_IDS.ALL_MAIL:
        case MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL:
        case MAILBOX_LABEL_IDS.CATEGORY_SOCIAL:
        case MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS:
        case MAILBOX_LABEL_IDS.CATEGORY_UPDATES:
        case MAILBOX_LABEL_IDS.CATEGORY_FORUMS:
        case MAILBOX_LABEL_IDS.CATEGORY_DEFAULT:
        case MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS:
        case MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS:
            primaryActions = ['trash', 'archive', 'spam'];
            break;
        case MAILBOX_LABEL_IDS.DRAFTS:
        case MAILBOX_LABEL_IDS.ALL_DRAFTS:
        case MAILBOX_LABEL_IDS.SENT:
        case MAILBOX_LABEL_IDS.ALL_SENT:
            primaryActions = ['trash', 'archive', 'delete'];
            break;
        case MAILBOX_LABEL_IDS.SCHEDULED:
        case MAILBOX_LABEL_IDS.SNOOZED:
            primaryActions = ['trash', 'archive'];
            break;
        case MAILBOX_LABEL_IDS.ARCHIVE:
            primaryActions = ['trash', 'inbox', 'spam'];
            break;
        case MAILBOX_LABEL_IDS.SPAM:
            primaryActions = ['trash', 'nospam', 'delete'];
            break;
        case MAILBOX_LABEL_IDS.TRASH:
            primaryActions = ['inbox', 'archive', 'delete'];
            break;
        case CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS:
            primaryActions = ['trash', 'archive', 'spam'];
            break;
    }

    if (isCustomFolder(labelID, folders)) {
        primaryActions = ['trash', 'archive', 'spam'];
    } else if (isCustomLabel(labelID, labels)) {
        primaryActions = ['trash', 'archive', 'spam'];
    }

    return [primaryActions, secondaryActions];
};
