import type { FileStorageGarbageCollector } from '@proton/pass/lib/file-storage/fs.gc';
import type { Maybe } from '@proton/pass/types';

import type { FileStorage } from './types';

export class FileStorageStub implements FileStorage {
    gc: Maybe<FileStorageGarbageCollector>;

    type: string = 'Stub';

    attachGarbageCollector() {}

    async readFile() {
        return undefined;
    }

    async writeFile() {
        throw new Error('Unsupported operation');
    }

    async deleteFile() {
        void 0;
    }

    async clearAll() {
        void 0;
    }
}
