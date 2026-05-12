import { c } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';

import { formatItemDateLabel } from '../../utils/formatItemDateLabel';
import type { FolderViewItem } from './useFolder.store';

interface GetFolderItemAriaLabelParams {
    item: FolderViewItem | undefined;
    isSelected: boolean;
    index: number;
}

// CSV-style aria-label for the row activator. Mirrors the visible columns
// (name, type, modified, size, share status), prefixed with selection state.
// Every value carries its own column label so the flat label is
// self-describing without column headers.
export const getFolderItemAriaLabel = ({ item, isSelected, index }: GetFolderItemAriaLabelParams): string => {
    const selection = isSelected ? c('Label').t`Selected` : c('Label').t`Not selected`;
    if (!item) {
        const position = index + 1;
        return `${selection}, ${c('Label').t`Item #${position}`}`;
    }
    const parts: string[] = [selection, item.name, item.isFile ? c('Label').t`File` : c('Label').t`Folder`];
    if (item.fileModifyTime) {
        const modified = formatItemDateLabel(item.fileModifyTime);
        parts.push(c('Label').t`Modified ${modified}`);
    }
    if (item.isFile) {
        parts.push(humanSize({ bytes: item.size }));
    }
    if (item.isShared) {
        parts.push(c('Label').t`Shared`);
    }
    return parts.join(', ');
};
