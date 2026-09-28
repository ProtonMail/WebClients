import { call, select } from 'redux-saga/effects';

import { PassCrypto } from '../../../lib/crypto';
import { encodeFolder } from '../../../lib/folders/folder-proto.transformer';
import { getFolderAndDescendantIds } from '../../../lib/folders/folder.utils';
import { parseFolderResponse } from '../../../lib/folders/folders.parser';
import { createFolderApi, deleteFoldersApi, updateFolderApi } from '../../../lib/folders/folders.requests';
import type { FolderCreateDTO, FolderData, FolderId } from '../../../types';
import { folderCreate, folderDelete, folderEdit } from '../../actions';
import { createRequestSaga } from '../../request/sagas';
import { selectShareFolders } from '../../selectors';

export const createFolderWorker = async ({ shareId, parentFolderId, name }: FolderCreateDTO): Promise<FolderData> => {
    const encodedFolder = encodeFolder({ name });
    const encryptedFolder = await PassCrypto.createFolder({
        shareId,
        content: encodedFolder,
        parentFolderId: parentFolderId,
    });

    const { Folder } = await createFolderApi({
        shareId,
        ParentFolderID: parentFolderId,
        ...encryptedFolder,
    });

    return parseFolderResponse(shareId, Folder);
};

const createFolderSaga = createRequestSaga({
    actions: folderCreate,
    call: async (dto) => ({ shareId: dto.shareId, folder: await createFolderWorker(dto) }),
});

const editFolderSaga = createRequestSaga({
    actions: folderEdit,
    call: async ({ shareId, folderId, name }) => {
        const encodedFolder = encodeFolder({ name });
        const Content = await PassCrypto.updateFolder({ shareId, folderId, content: encodedFolder });

        const { Folder } = await updateFolderApi({ shareId, folderId, Content });

        const folder = await parseFolderResponse(shareId, Folder);

        return { shareId, folder };
    },
});

const deleteFoldersSaga = createRequestSaga({
    actions: folderDelete,
    call: function* ({ shareId, folderIds }) {
        /* BE automatically recursively deletes a folder and all items in its subfolders,
         * so we must do the same in the client state. */
        const folders: Record<FolderId, FolderData> = yield select(selectShareFolders(shareId));
        const folderAndDescendantsIds = [...new Set(folderIds.flatMap((id) => [...getFolderAndDescendantIds(folders, id)]))];
        yield call(deleteFoldersApi, { shareId, folderIds });
        PassCrypto.removeFolderKeys(shareId, folderAndDescendantsIds);

        return { shareId, folderIds: folderAndDescendantsIds };
    },
});

export default [createFolderSaga, editFolderSaga, deleteFoldersSaga];
