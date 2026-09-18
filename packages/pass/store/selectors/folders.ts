import { createSelector } from '@reduxjs/toolkit';

import { FOLDER_MAX_CHILDREN, FOLDER_MAX_COUNT, FOLDER_MAX_DEPTH } from '../../constants';
import type { FoldersById } from '../../lib/folders/folder.utils';
import { getFolderChildren, resolveFolderPath } from '../../lib/folders/folder.utils';
import type { FolderData, Maybe, MaybeNull } from '../../types';
import type { State } from '../types';
import { selectUserPlan } from './user';
import { EMPTY_LIST } from './utils';

export const selectFolders = (state: State) => state.folders;

const EMPTY_FOLDERS: FoldersById = {};

export const selectShareFolders = (shareId: string) =>
    createSelector([selectFolders], (folders): FoldersById => folders[shareId] ?? EMPTY_FOLDERS);

export const selectFolder =
    (shareId: MaybeNull<string>, folderId: MaybeNull<string>) =>
    (state: State): Maybe<FolderData> =>
        shareId && folderId ? state.folders[shareId]?.[folderId] : undefined;

export const selectChildFolders = (shareId: string, parentFolderId: MaybeNull<string>) =>
    createSelector(
        [selectShareFolders(shareId)],
        (shareFolders): readonly FolderData[] => getFolderChildren(shareFolders).get(parentFolderId) ?? EMPTY_LIST
    );

export const selectTopLevelFolders = (shareId: string) => selectChildFolders(shareId, null);

export const selectFolderPath = (shareId: string, folderId: MaybeNull<string>) =>
    createSelector([selectShareFolders(shareId)], (shareFolders): FolderData[] => resolveFolderPath(shareFolders, folderId));

type FolderLimits = { maxCountPerVault: number; maxChildren: number; maxDepth: number };

export const selectFolderLimits = createSelector([selectUserPlan], (plan): FolderLimits => ({
    maxCountPerVault: plan?.FolderMaxCount ?? FOLDER_MAX_COUNT,
    maxChildren: plan?.FolderMaxChildren ?? FOLDER_MAX_CHILDREN,
    maxDepth: plan?.FolderMaxDepth ?? FOLDER_MAX_DEPTH,
}));

export type FolderLimitReason = 'count' | 'children' | 'depth';

export const selectFolderLimitReason = (shareId: string, parentFolderId: MaybeNull<string>) =>
    createSelector(
        [selectShareFolders(shareId), selectFolderLimits],
        (shareFolders, { maxCountPerVault, maxChildren, maxDepth }): MaybeNull<FolderLimitReason> => {
            const folders = Object.values(shareFolders);
            if (folders.length >= maxCountPerVault) return 'count';

            const siblingCount = getFolderChildren(shareFolders).get(parentFolderId)?.length ?? 0;
            if (siblingCount >= maxChildren) return 'children';

            if (parentFolderId) {
                const parentDepth = resolveFolderPath(shareFolders, parentFolderId).length;
                if (parentDepth >= maxDepth) return 'depth';
            }

            return null;
        }
    );
