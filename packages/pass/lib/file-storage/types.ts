import type { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { AnyStorage, Maybe, StorageData } from '@proton/pass/types';

export type FileBuffer = Blob | Uint8Array;
export interface FileStorage {
    /** Type of the FS interface */
    type: string;

    /** Optional FileStorageGarbageCollector instance.
     * Set using `FileStorage::attachGarbageCollector` */
    gc: Maybe<FileStorageGarbageCollector>;

    readFile: (filename: string, mimeType?: string) => Promise<Maybe<File>>;
    writeFile: (filename: string, file: FileBuffer | ReadableStream<FileBuffer>, signal: AbortSignal) => Promise<void>;
    deleteFile: (filename: string) => Promise<void>;
    clearAll: () => Promise<void>;

    attachGarbageCollector: (storage: AnyStorage<StorageData>) => void;
}
