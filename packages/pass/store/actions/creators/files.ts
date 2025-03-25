import { getItemKey, getItemRevisionKey } from '@proton/pass/lib/items/item.utils';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    FileChunkUploadDTO,
    FileDownloadDTO,
    FileDownloadPublicDTO,
    FileID,
    FileInitiateUploadDTO,
    FileMetadataDTO,
    FileResolveDTO,
    FileRestoreDTO,
    FilesMetadataEditSuccess,
    FilesRequestSuccess,
    ItemLinkFiles,
    ItemRevision,
} from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const fileUploadInitiate = requestActionsFactory<FileInitiateUploadDTO, FileID>('file::upload::initiate')({
    key: () => uniqueId(),
});

export const fileUploadChunk = requestActionsFactory<FileChunkUploadDTO, boolean>('file::upload::chunk')({
    key: ({ fileID, index }) => `${fileID}::${index}`,
});

export const fileDownload = requestActionsFactory<FileDownloadDTO, string>('file::download')({
    key: ({ shareId, itemId, fileID }) => `${shareId}::${itemId}::${fileID}`,
});

export const fileDownloadPublic = requestActionsFactory<FileDownloadPublicDTO, string>('file::download::public')({
    key: ({ filesToken, fileID }) => `${filesToken}::${fileID}`,
});

export const fileUpdateMetadata = requestActionsFactory<FileMetadataDTO, FilesMetadataEditSuccess>(
    'file::update::metadata'
)({
    key: prop('fileID'),
});

export const fileLinkPending = requestActionsFactory<ItemLinkFiles, ItemRevision>('file::link::pending')({
    key: getItemKey,
});

export const filesResolve = requestActionsFactory<FileResolveDTO, FilesRequestSuccess>('files::resolve')({
    key: getItemRevisionKey,
    success: { config: { maxAge: UNIX_MINUTE } },
});

export const fileRestore = requestActionsFactory<FileRestoreDTO, FilesRequestSuccess>('files::restore')({
    key: getItemKey,
});
