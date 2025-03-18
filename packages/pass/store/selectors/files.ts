import { createSelector } from '@reduxjs/toolkit';

import type { State } from '@proton/pass/store/types';
import type { FileDescriptor } from '@proton/pass/types';

export const selectFiles = (state: State) => state.files;

export const selectItemFiles = (shareId: string, itemId: string) =>
    createSelector([selectFiles], (files): FileDescriptor[] => files?.[shareId]?.[itemId] ?? []);

/** Active files for latest revision can be inferred by filtering
 * over non-removed files in a previous revision. */
export const selectItemFilesCount = (shareId: string, itemId: string) =>
    createSelector(selectItemFiles(shareId, itemId), (files) => files.filter((file) => !file.revisionRemoved).length);

export const selectItemFilesForRevision = (shareId: string, itemId: string, revision: number) =>
    createSelector(selectItemFiles(shareId, itemId), (files) =>
        files.filter(
            ({ revisionAdded, revisionRemoved }) =>
                revision >= revisionAdded && (!revisionRemoved || revision < revisionRemoved)
        )
    );
