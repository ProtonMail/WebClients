import type { Maybe } from '@proton/pass/types';

export interface FileStorage {
    readFile: (filename: string) => Promise<Maybe<File>>;
    writeFile: (filename: string, file: Blob | ReadableStream<Blob>) => Promise<void>;
    deleteFile: (filename: string) => Promise<void>;
    clearAll: () => Promise<void>;
}
