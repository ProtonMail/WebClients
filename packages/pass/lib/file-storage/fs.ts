import { FileStorageMemory } from '@proton/pass/lib/file-storage/fs.memory';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import { FileStorageIDB, openPassFileDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

export const fileStorageReady = awaiter<boolean>();

/** isSafari() works on web app but not on extension
 * background script, so we have to use BUILD_TARGET */
const isOPFSSupported = () =>
    BUILD_TARGET !== 'safari' && !isSafari() && Boolean(navigator.storage && navigator.storage.getDirectory);

type StorageOptions = { OPFS: boolean; IDB: boolean };

export const getSupportedFileStorage = (options: StorageOptions) => {
    if (options.OPFS && isOPFSSupported()) return new FileStorageOPFS();
    if (options.IDB && 'indexedDB' in globalThis) return new FileStorageIDB();
    return new FileStorageMemory();
};

export let fileStorage: FileStorage = getSupportedFileStorage({ OPFS: true, IDB: true });

const onStorageFallback = async () => {
    let options: StorageOptions = { OPFS: true, IDB: true };

    try {
        switch (fileStorage.type) {
            case 'OPFS':
                /** Verify OPFS availability by attempting to access storage directory.
                 * This confirms both API support and necessary permissions. */
                options.OPFS = false;
                await navigator.storage.getDirectory();
            case 'IDB':
                /** Verify IndexedDB functionality by opening the database.
                 * This catches restrictions in private browsing modes. */
                options.OPFS = false;
                options.IDB = false;
                await openPassFileDB();
        }
    } catch {
        const unsupported = fileStorage.type;
        fileStorage = getSupportedFileStorage(options);
        logger.info(`[fs::${unsupported}] storage not supported - switching to ${fileStorage.type}`);

        await onStorageFallback().catch(noop);
    } finally {
        fileStorageReady.resolve(true);
    }
};

onStorageFallback().catch(noop);
