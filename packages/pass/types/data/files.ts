import type {
    FileMetadata,
    ItemFileChunkOutput,
    ItemId,
    MaybeNull,
    SelectedItem,
    SelectedRevision,
    ShareId,
} from '@proton/pass/types';

export type FileID = string;

export type BaseFileDescriptor = FileMetadata & {
    encryptionVersion: number;
    fileID: FileID;
    size: number;
};

export type FileDescriptor = BaseFileDescriptor & {
    chunks: ItemFileChunkOutput[];
    revisionAdded: number;
    revisionRemoved: MaybeNull<number>;
    fileUID: string;
};

export type FileInitiateUploadDTO = FileMetadata & {
    encryptionVersion: number;
    shareId: ShareId;
    totalChunks: number;
    uploadID: string;
};

export type FileChunkUploadDTO = {
    chunkIndex: number;
    encryptionVersion: number;
    fileID: FileID;
    shareId: ShareId;
    totalChunks: number;
} & ({ type: 'blob'; blob: Blob } | { type: 'fs'; ref: string });

export type FileAttachmentsDTO = { toAdd: FileID[]; toRemove: FileID[]; toRestore?: FileID[] };
export type FileMetadataDTO = BaseFileDescriptor & {
    /** Optional in-case item has not been created yet  */
    itemId?: ItemId;
    shareId: ShareId;
};

type FileDownloadChunkBase = { fileID: FileID; chunkID: string };
type FileDownloadDTOBase = { fileID: FileID; chunkIDs: string[]; encryptionVersion: number };

export type FileDownloadDTO = FileDownloadDTOBase & SelectedItem;
export type FileDownloadChunk = FileDownloadChunkBase & SelectedItem;

export type FileDownloadPublicDTO = FileDownloadDTOBase & { filesToken: string };
export type FileDownloadPublicChunk = FileDownloadChunkBase & { filesToken: string };

export type FileResolveDTO = ({ history: true } & SelectedItem) | (SelectedRevision & { history?: false });
export type FileRestoreDTO = { fileId: FileID } & SelectedItem;
export type FileAttachmentValues = { files: FileAttachmentsDTO };
export type FilesRequestSuccess = { files: FileDescriptor[]; history?: boolean } & SelectedItem;
export type FilesMetadataEditSuccess = BaseFileDescriptor & Partial<SelectedItem>;

export type FileTransferWriteDTO = { fileRef: string; b64: string };
export type FileTransferErrorDTO = { fileRef: string };
