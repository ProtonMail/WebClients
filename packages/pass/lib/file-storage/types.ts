import type { Maybe } from '@proton/pass/types';

export type FileBuffer = Blob | Uint8Array;
export interface FileStorage {
    readFile: (filename: string) => Promise<Maybe<File>>;
    writeFile: (filename: string, file: FileBuffer | ReadableStream<FileBuffer>, signal?: AbortSignal) => Promise<void>;
    deleteFile: (filename: string) => Promise<void>;
    clearAll: () => Promise<void>;
}
