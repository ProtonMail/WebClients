import { c } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';

import { formatItemDateLabel } from '../../utils/formatItemDateLabel';
import type { TrashItem } from './useTrash.store';

interface GetTrashItemAriaLabelParams {
    item: TrashItem | undefined;
    isSelected: boolean;
    index: number;
}

// CSV-style aria-label for the row activator. Mirrors the visible columns
// (name, location, deleted, size), prefixed with selection state.
export const getTrashItemAriaLabel = ({ item, isSelected, index }: GetTrashItemAriaLabelParams): string => {
    const selection = isSelected ? c('Label').t`Selected` : c('Label').t`Not selected`;
    if (!item) {
        const position = index + 1;
        return `${selection}, ${c('Label').t`Item #${position}`}`;
    }
    const parts: string[] = [selection, item.name];
    if (item.location) {
        parts.push(c('Label').t`Location: ${item.location}`);
    }
    if (item.trashTime) {
        const deleted = formatItemDateLabel(item.trashTime);
        parts.push(c('Label').t`Deleted ${deleted}`);
    }
    if (item.size !== undefined) {
        parts.push(humanSize({ bytes: item.size }));
    }
    return parts.join(', ');
};
