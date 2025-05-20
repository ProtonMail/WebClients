import { c, msgid } from 'ttag';

import type { Filter } from '@proton/components/containers/filters/interfaces';
import { getStandardFolders } from '@proton/mail/labels/helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';
import type { Folder, UserModel } from '@proton/shared/lib/interfaces';
import type {
    ApplyNewsletterSubscriptionsFilter,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type { ModalFilterType } from './interface';

interface GetUnsubscribeDataParams {
    trash: boolean;
    archive: boolean;
    read: boolean;
}

export const getUnsubscribeData = ({
    trash,
    archive,
    read,
}: GetUnsubscribeDataParams): ApplyNewsletterSubscriptionsFilter => {
    switch (true) {
        case trash:
            return {
                ApplyTo: 'All',
                MarkAsRead: read,
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
            };
        case archive:
            return {
                ApplyTo: 'All',
                MarkAsRead: read,
                DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE,
            };
        default:
            return {
                ApplyTo: 'All',
                MarkAsRead: read,
            };
    }
};

export const getFilterData = (
    action: ModalFilterType,
    subscription: NewsletterSubscription,
    applyToFuture: boolean
): ApplyNewsletterSubscriptionsFilter => {
    switch (action) {
        case 'MarkAsRead':
            return {
                ApplyTo: applyToFuture ? 'All' : 'Existing',
                MarkAsRead: true,
            };
        case 'MoveToTrash':
            return {
                ApplyTo: applyToFuture ? 'All' : 'Existing',
                DestinationFolder: MAILBOX_LABEL_IDS.TRASH,
                MarkAsRead: !!subscription.MarkAsRead,
            };
        case 'MoveToArchive':
            return {
                ApplyTo: applyToFuture ? 'All' : 'Existing',
                DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE,
                MarkAsRead: !!subscription.MarkAsRead,
            };
    }
};

export const getSubscriptionMoveToFolderName = (folders: Folder[], folderId: string) => {
    const folder = folders.find((folder) => folder.ID === folderId);
    if (folder) {
        return folder.Name;
    }

    const systemFolder = getStandardFolders()[folderId];
    if (systemFolder) {
        return systemFolder.name;
    }

    return undefined;
};

export const shouldOpenUpsellOnFilterClick = (
    subscription: NewsletterSubscription,
    user: UserModel,
    filters: Filter[]
) => {
    if (!hasReachedFiltersLimit(user, filters)) {
        return false;
    }

    if (!subscription.FilterID) {
        return true;
    }

    return !filters.some((filter) => filter.ID === subscription.FilterID);
};

export const getNewsletterCopyForFilterAction = (subscription: NewsletterSubscription, filterType: ModalFilterType) => {
    const count = subscription.ReceivedMessages.Total;

    if (filterType === 'MarkAsRead') {
        return c('Label').ngettext(msgid`Marked ${count} message as read.`, `Marked ${count} messages as read.`, count);
    } else if (filterType === 'MoveToArchive') {
        return c('Label').ngettext(
            msgid`Moved ${count} message to Archive.`,
            `Moved ${count} messages to Archive.`,
            count
        );
    }

    return c('Label').ngettext(msgid`Moved ${count} message to Trash.`, `Moved ${count} messages to Trash.`, count);
};
