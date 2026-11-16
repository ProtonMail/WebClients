import type { Snapshots } from 'roosterjs-content-model-types';

import { ROOSTER_SNAPSHOTS_MAX_SIZE } from '../../constants';

export const createUndoSnapshots = (): Snapshots => ({
    snapshots: [],
    totalSize: 0,
    currentIndex: -1,
    autoCompleteIndex: -1,
    maxSize: ROOSTER_SNAPSHOTS_MAX_SIZE,
});

/**
 * The editor keeps a reference to the object it was created with, so it is emptied in place
 */
export const clearUndoSnapshots = (snapshots: Snapshots) => {
    snapshots.snapshots.splice(0);
    snapshots.totalSize = 0;
    snapshots.currentIndex = -1;
    snapshots.autoCompleteIndex = -1;
    snapshots.onChanged?.('clear');
};
