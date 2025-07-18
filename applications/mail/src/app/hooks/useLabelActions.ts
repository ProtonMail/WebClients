import { useFolders, useLabels } from '@proton/mail';
import { isCustomFolder, isCustomLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';

const {
    TRASH,
    SPAM,
    DRAFTS,
    ARCHIVE,
    SENT,
    INBOX,
    ALL_DRAFTS,
    ALL_SENT,
    STARRED,
    ALL_MAIL,
    ALMOST_ALL_MAIL,
    SCHEDULED,
    SNOOZED,
} = MAILBOX_LABEL_IDS;

type Actions = 'inbox' | 'trash' | 'delete' | 'archive' | 'spam' | 'nospam';

export const useLabelActions = (labelID: string): [primaryActions: Actions[], secondaryActions: Actions[]] => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    let primaryActions: Actions[] = [];
    let secondaryActions: Actions[] = [];

    switch (labelID) {
        case INBOX:
        case STARRED:
        case ALL_MAIL:
        case ALMOST_ALL_MAIL:
            primaryActions = ['trash', 'archive', 'spam'];
            break;
        case DRAFTS:
        case ALL_DRAFTS:
        case SENT:
        case ALL_SENT:
            primaryActions = ['trash', 'archive', 'delete'];
            break;
        case SCHEDULED:
        case SNOOZED:
            primaryActions = ['trash', 'archive'];
            break;
        case ARCHIVE:
            primaryActions = ['trash', 'inbox', 'spam'];
            break;
        case SPAM:
            primaryActions = ['trash', 'nospam', 'delete'];
            break;
        case TRASH:
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
