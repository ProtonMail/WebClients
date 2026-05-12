import { c } from 'ttag';

import { formatItemDateLabel } from '../../utils/formatItemDateLabel';
import { formatAccessCount } from '../../utils/formatters';
import type { SharedByMeItem } from './useSharedByMe.store';

interface GetSharedByMeItemAriaLabelParams {
    item: SharedByMeItem | undefined;
    isSelected: boolean;
    index: number;
    now?: Date;
}

// CSV-style aria-label for the row activator. Mirrors the visible columns
// (name, location, created, downloads, expires), prefixed with selection state.
// Every value carries its own column label so the flat label is
// self-describing without column headers.
export const getSharedByMeItemAriaLabel = ({
    item,
    isSelected,
    index,
    now = new Date(),
}: GetSharedByMeItemAriaLabelParams): string => {
    const selection = isSelected ? c('Label').t`Selected` : c('Label').t`Not selected`;
    if (!item) {
        const position = index + 1;
        return `${selection}, ${c('Label').t`Item #${position}`}`;
    }
    const parts: string[] = [selection, item.name];
    if (item.location !== undefined) {
        parts.push(c('Label').t`Location: ${item.location}`);
    }
    if (item.creationTime) {
        const created = formatItemDateLabel(item.creationTime);
        parts.push(c('Label').t`Created ${created}`);
    }
    const downloads = formatAccessCount(item.publicLink?.numberOfInitializedDownloads);
    parts.push(c('Label').t`${downloads} downloads`);
    const expirationTime = item.publicLink?.expirationTime;
    if (!expirationTime) {
        parts.push(c('Label').t`Never expires`);
    } else {
        const formatted = formatItemDateLabel(expirationTime);
        parts.push(expirationTime < now ? c('Label').t`Expired on ${formatted}` : c('Label').t`Expires ${formatted}`);
    }
    return parts.join(', ');
};
