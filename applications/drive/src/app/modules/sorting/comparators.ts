import { NodeType } from '@proton/drive';

import type { Comparator } from './types';

/**
 * Locale-aware string comparison with numeric sorting (e.g., "file2" < "file10")
 */
export const stringComparator: Comparator<string> = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export const numberComparator: Comparator<number> = (a, b) => {
    return a - b;
};

/**
 * Date comparison - undefined dates sort to the end
 */
export const dateComparator: Comparator<Date | undefined> = (a, b) => {
    if (!a && !b) {
        return 0;
    }
    if (!a) {
        return 1;
    }
    if (!b) {
        return -1;
    }
    return a.getTime() - b.getTime();
};

/**
 * NodeType comparator: Folders and Albums before Files and Photos
 */
export const nodeTypeComparator: Comparator<NodeType> = (a, b) => {
    const isFileOrPhotoA = a === NodeType.File || a === NodeType.Photo;
    const isFileOrPhotoB = b === NodeType.File || b === NodeType.Photo;

    if (isFileOrPhotoA === isFileOrPhotoB) {
        return 0;
    }
    return isFileOrPhotoA ? 1 : -1;
};
