import type { ExportedFile } from '@proton/pass/lib/export/types';
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
export type BaseFileDescriptor = FileMetadata & { size: number; fileID: FileID };

export type FileDescriptor = BaseFileDescriptor & {
    chunks: ItemFileChunkOutput[];
    revisionAdded: number;
    revisionRemoved: MaybeNull<number>;
    fileUID: string;
};

export type FileInitiateUploadDTO = FileMetadata & { totalChunks: number };
export type FileChunkUploadDTO = { fileID: FileID; chunk: ArrayBuffer; index: number };
export type FileAttachmentsDTO = { toAdd: FileID[]; toRemove: FileID[]; toRestore?: FileID[] };
export type FileMetadataDTO = BaseFileDescriptor & Partial<SelectedItem>;
export type FileDownloadDTO = { fileID: FileID; chunkID: string } & SelectedItem;
export type FileDownloadPublicDTO = { fileID: FileID; chunkID: string; filesToken: string };
export type FileResolveDTO = SelectedRevision & { history?: boolean };
export type FileRestoreDTO = { fileId: FileID } & SelectedItem;
export type FileAttachmentValues = { files: FileAttachmentsDTO };
export type FilesRequestSuccess = { files: FileDescriptor[]; history?: boolean } & SelectedItem;
export type FilesMetadataEditSuccess = BaseFileDescriptor & Partial<SelectedItem>;
export type FileItemExport = Record<ShareId, Record<ItemId, ExportedFile[]>>;
