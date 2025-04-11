import { getItemKey, getItemRevisionKey } from '@proton/pass/lib/items/item.utils';
import { withAbortPayload } from '@proton/pass/store/actions/creators/utils';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    FileChunkUploadDTO,
    FileDownloadDTO,
    FileDownloadPublicDTO,
    FileForDownload,
    FileID,
    FileInitiateUploadDTO,
    FileMetadataDTO,
    FileResolveDTO,
    FileRestoreDTO,
    FilesMetadataEditSuccess,
    FilesRequestSuccess,
    ItemLinkFilesIntent,
    ItemLinkFilesSuccess,
    WithTabId,
} from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const fileUploadInitiate = requestActionsFactory<FileInitiateUploadDTO, FileID>('file::upload::initiate')({
    key: prop('uploadID'),
    failure: { prepare: withAbortPayload },
});

export const fileUploadChunk = requestActionsFactory<WithTabId<FileChunkUploadDTO>, boolean>('file::upload::chunk')({
    key: ({ fileID, chunkIndex, tabId }) => `${tabId ?? 0}::${fileID}::${chunkIndex}`,
    failure: { prepare: withAbortPayload },
});

export const fileDownload = requestActionsFactory<WithTabId<FileDownloadDTO>, FileForDownload>('file::download')({
    key: ({ shareId, itemId, fileID, tabId }) => `${tabId ?? 0}::${shareId}::${itemId}::${fileID}`,
});

export const fileDownloadPublic = requestActionsFactory<FileDownloadPublicDTO, FileForDownload>(
    'file::download::public'
)({
    key: ({ filesToken, fileID }) => `${filesToken}::${fileID}`,
});

export const fileUpdateMetadata = requestActionsFactory<FileMetadataDTO, FilesMetadataEditSuccess>(
    'file::update::metadata'
)({
    key: prop('fileID'),
});

export const fileLinkPending = requestActionsFactory<ItemLinkFilesIntent, ItemLinkFilesSuccess>('file::link::pending')({
    key: getItemKey,
});

export const filesResolve = requestActionsFactory<FileResolveDTO, FilesRequestSuccess>('files::resolve')({
    key: (dto) => (dto.history ? getItemKey(dto) : getItemRevisionKey(dto)),
    success: { config: { maxAge: UNIX_MINUTE } },
});

export const fileRestore = requestActionsFactory<FileRestoreDTO, FilesRequestSuccess>('files::restore')({
    key: getItemKey,
});
