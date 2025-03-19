import type { Maybe } from '@proton/pass/types';

export interface FileStorage {
    readFile: (filename: string) => Promise<Maybe<File>>;
    /** Remember to always clear storage after using this function */
    writeFile: (filename: string, file: Blob | ReadableStream) => Promise<void>;
    deleteFile: (filename: string) => Promise<void>;
    /** Delete all files */
    clearAll: () => Promise<void>;
}
