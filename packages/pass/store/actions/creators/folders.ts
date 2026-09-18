import { createAction } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import type {
    FolderCreateDTO,
    FolderCreateSuccess,
    FolderData,
    FolderDeleteDTO,
    FolderDeleteSuccess,
    FolderEditDTO,
    FolderEditSuccess,
    FolderId,
    ShareId,
} from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import { withNotification } from '../enhancers/notification';

export const folderCreate = requestActionsFactory<FolderCreateDTO, FolderCreateSuccess>('folder::create')({
    key: (dto) => `${dto.shareId}::${dto.name}`,
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Folder "${payload.folder.name}" created`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to create folder`,
                error,
            })({ payload, error }),
    },
});

export const folderEdit = requestActionsFactory<FolderEditDTO, FolderEditSuccess>('folder::edit')({
    key: (dto) => `${dto.shareId}::${dto.folderId}`,
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Folder renamed to "${payload.folder.name}"`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to update folder`,
                error,
            })({ payload, error }),
    },
});

export const foldersUpdated = createAction('folders::updated', (folders: FolderData[]) => withCache({ payload: { folders } }));

export const foldersDeletedEvent = createAction('folders::deleted', (shareId: ShareId, folderIds: FolderId[]) =>
    withCache({ payload: { shareId, folderIds } })
);

export const folderDelete = requestActionsFactory<FolderDeleteDTO, FolderDeleteSuccess>('folder::delete')({
    key: (dto) => `${dto.shareId}::${dto.folderIds.join(',')}`,
    success: {
        prepare: (payload) =>
            pipe(
                withCache,
                withNotification({
                    type: 'success',
                    text: c('Info').t`Folder deleted`,
                })
            )({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').ngettext(msgid`Failed to delete folder`, `Failed to delete folders`, payload.folderIds.length),
                error,
            })({ payload, error }),
    },
});
