import type { Action, Reducer } from 'redux';

import type { FoldersById } from '../../lib/folders/folder.utils';
import type { FolderData, ShareId } from '../../types';
import { or } from '../../utils/fp/predicates';
import { objectDelete } from '../../utils/object/delete';
import { fullMerge } from '../../utils/object/merge';
import {
    folderCreate,
    folderDelete,
    folderEdit,
    foldersDeletedEvent,
    foldersUpdated,
    inviteAccept,
    matchSyncAction,
    shareCreated,
    shareDeleted,
    shareLeaveSuccess,
    sharesEventNew,
    vaultDeleteSuccess,
} from '../actions';

export type FoldersByShareId = Record<ShareId, FoldersById>;

const intoFoldersById = (folders: FolderData[]): FoldersById =>
    folders.reduce<FoldersById>((acc, folder) => {
        acc[folder.folderId] = folder;
        return acc;
    }, {});

const foldersReducer: Reducer<FoldersByShareId> = (state = {}, action: Action) => {
    if (matchSyncAction(action) && action.payload?.folders !== undefined) return action.payload.folders;

    if (folderCreate.success.match(action)) {
        const { shareId, folder } = action.payload;
        return fullMerge(state, { [shareId]: { [folder.folderId]: folder } });
    }

    if (sharesEventNew.match(action)) return fullMerge(state, action.payload.folders);

    if (shareCreated.match(action)) {
        const { share, folders } = action.payload;
        /** Wipe existing folders for this share before merging so stale entries don't survive */
        return fullMerge(objectDelete(state, share.shareId), { [share.shareId]: intoFoldersById(folders) });
    }

    if (or(shareDeleted.match, vaultDeleteSuccess.match, shareLeaveSuccess.match)(action)) {
        return objectDelete(state, action.payload.shareId);
    }

    if (inviteAccept.success.match(action)) {
        const { share, folders } = action.payload;
        if (folders.length === 0) return state;
        return fullMerge(state, { [share.shareId]: intoFoldersById(folders) });
    }

    if (folderEdit.success.match(action)) {
        const { shareId, folder } = action.payload;
        return fullMerge(state, { [shareId]: { [folder.folderId]: folder } });
    }

    if (foldersUpdated.match(action)) {
        const { folders } = action.payload;
        if (folders.length === 0) return state;
        return folders.reduce((acc, folder) => fullMerge(acc, { [folder.shareId]: { [folder.folderId]: folder } }), state);
    }

    if (or(folderDelete.success.match, foldersDeletedEvent.match)(action)) {
        const { shareId, folderIds } = action.payload;
        if (!state[shareId]) return state;

        let updatedShareFolders = state[shareId];
        folderIds.forEach((folderId) => {
            updatedShareFolders = objectDelete(updatedShareFolders, folderId);
        });

        return { ...state, [shareId]: updatedShareFolders };
    }

    return state;
};

export default foldersReducer;
