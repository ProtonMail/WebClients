import type { FileMetadata, ItemFileChunkOutput, MaybeNull, SelectedItem, SelectedRevision } from '@proton/pass/types';

export type FileID = string;
export type BaseFileDescriptor = FileMetadata & { size: number; fileID: FileID };

export type FileDescriptor = BaseFileDescriptor & {
    chunks: ItemFileChunkOutput[];
    revisionAdded: number;
    revisionRemoved: MaybeNull<number>;
    fileUID: string;
};

export type FileInitiateUploadDTO = FileMetadata & { totalChunks: number; uploadID: string };
export type FileChunkUploadDTO = { fileID: FileID; index: number } & (
    | { type: 'blob'; blob: Blob }
    | { type: 'fs'; ref: string }
);
export type FileAttachmentsDTO = { toAdd: FileID[]; toRemove: FileID[]; toRestore?: FileID[] };
export type FileMetadataDTO = BaseFileDescriptor & Partial<SelectedItem>;

type FileDownloadChunkBase = { fileID: FileID; chunkID: string };
type FileDownloadDTOBase = { fileID: FileID; chunkIDs: string[] };

export type FileDownloadDTO = FileDownloadDTOBase & SelectedItem;
export type FileDownloadChunk = FileDownloadChunkBase & SelectedItem;

export type FileDownloadPublicDTO = FileDownloadDTOBase & { filesToken: string };
export type FileDownloadPublicChunk = FileDownloadChunkBase & { filesToken: string };

export type FileResolveDTO = ({ history: true } & SelectedItem) | (SelectedRevision & { history?: false });
export type FileRestoreDTO = { fileId: FileID } & SelectedItem;
export type FileAttachmentValues = { files: FileAttachmentsDTO };
export type FilesRequestSuccess = { files: FileDescriptor[]; history?: boolean } & SelectedItem;
export type FilesMetadataEditSuccess = BaseFileDescriptor & Partial<SelectedItem>;
