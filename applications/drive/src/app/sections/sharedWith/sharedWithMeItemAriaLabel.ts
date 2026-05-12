import { c } from 'ttag';

import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { formatItemDateLabel } from '../../utils/formatItemDateLabel';
import { ItemType, type SharedWithMeItem } from './useSharedWithMe.store';

const resolveDisplayName = (email: string, contactEmails: ContactEmail[] | undefined): string => {
    const contact = contactEmails?.find((c) => c.Email === email);
    return contact?.Name || email;
};

interface GetSharedWithMeItemAriaLabelParams {
    item: SharedWithMeItem | undefined;
    isSelected: boolean;
    index: number;
    contactEmails: ContactEmail[] | undefined;
}

// CSV-style aria-label for the row activator. Mirrors the visible columns
// (name, shared by, shared on / status), prefixed with selection state.
export const getSharedWithMeItemAriaLabel = ({
    item,
    isSelected,
    index,
    contactEmails,
}: GetSharedWithMeItemAriaLabelParams): string => {
    const selection = isSelected ? c('Label').t`Selected` : c('Label').t`Not selected`;
    if (!item) {
        const position = index + 1;
        return `${selection}, ${c('Label').t`Item #${position}`}`;
    }
    const parts: string[] = [selection, item.name];
    if (item.itemType === ItemType.BOOKMARK) {
        parts.push(c('Label').t`Shared by Public link`);
        if (item.bookmark.creationTime) {
            const sharedOn = formatItemDateLabel(item.bookmark.creationTime);
            parts.push(c('Label').t`Shared on ${sharedOn}`);
        }
    } else if (item.itemType === ItemType.DIRECT_SHARE) {
        const sharedBy = resolveDisplayName(item.directShare.sharedBy, contactEmails);
        parts.push(c('Label').t`Shared by ${sharedBy}`);
        if (item.directShare.sharedOn) {
            const sharedOn = formatItemDateLabel(item.directShare.sharedOn);
            parts.push(c('Label').t`Shared on ${sharedOn}`);
        }
    } else {
        const sharedBy = resolveDisplayName(item.invitation.sharedBy, contactEmails);
        parts.push(c('Label').t`Shared by ${sharedBy}`);
        parts.push(c('Label').t`Pending invitation`);
    }
    return parts.join(', ');
};
