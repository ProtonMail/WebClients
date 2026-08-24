import { getItemKey, getItemRevisionKey } from '../../../lib/items/item.utils';
import type {
    FileChunkUploadDTO,
    FileDownloadDTO,
    FileDownloadPublicDTO,
    FileForDownload,
    FileInitiateUploadDTO,
    FileMetadataDTO,
    FileResolveDTO,
    FileRestoreDTO,
    FileUploadInitiateDTO,
    FilesMetadataEditSuccess,
    FilesRequestSuccess,
    ItemLinkFilesIntent,
    ItemLinkFilesSuccess,
    WithTabId,
} from '../../../types';
import { prop } from '../../../utils/fp/lens';
import { UNIX_MINUTE } from '../../../utils/time/constants';
import { dataRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';
import { withAbortPayload } from './utils';

export const fileUploadInitiate = requestActionsFactory<FileInitiateUploadDTO, FileUploadInitiateDTO>('file::upload::initiate')({
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

export const fileDownloadPublic = requestActionsFactory<FileDownloadPublicDTO, FileForDownload>('file::download::public')({
    key: ({ filesToken, fileID }) => `${filesToken}::${fileID}`,
});

export const fileUpdateMetadata = requestActionsFactory<FileMetadataDTO, FilesMetadataEditSuccess>('file::update::metadata')({
    key: prop('fileID'),
});

export const fileLinkPending = requestActionsFactory<ItemLinkFilesIntent, ItemLinkFilesSuccess>('file::link::pending')({
    key: getItemKey,
});

export const filesResolve = requestActionsFactory<FileResolveDTO, FilesRequestSuccess>('files::resolve')({
    key: (dto) => (dto.history ? getItemKey(dto) : getItemRevisionKey(dto)),
    success: dataRequest(UNIX_MINUTE),
});

export const fileRestore = requestActionsFactory<FileRestoreDTO, FilesRequestSuccess>('files::restore')({
    key: getItemKey,
});
