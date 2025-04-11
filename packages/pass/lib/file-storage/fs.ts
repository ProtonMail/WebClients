import { FileStorageMemory } from '@proton/pass/lib/file-storage/fs.memory';
import { FileStorageStub } from '@proton/pass/lib/file-storage/fs.stub';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import { FileStorageIDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

export const fileStorageReady = awaiter<boolean>();

/** isSafari() works on web app but not on extension
 * background script, so we have to use BUILD_TARGET */
const isOPFSSupported = () =>
    BUILD_TARGET !== 'safari' && !isSafari() && Boolean(navigator.storage && navigator.storage.getDirectory);

export const getSupportedFileStorage = (options: { tryOPFS: boolean }) => {
    if (options.tryOPFS && isOPFSSupported()) return new FileStorageOPFS();
    if ('indexedDB' in globalThis) return new FileStorageIDB();
    return !EXTENSION_BUILD ? new FileStorageMemory() : new FileStorageStub();
};

export let fileStorage: FileStorage = getSupportedFileStorage({ tryOPFS: true });

(async () => {
    if (fileStorage.type === 'OPFS') {
        try {
            /** Checking if OPFS is indeed supported can only happen
             * asynchronously to check for browser permissions. */
            await navigator.storage.getDirectory();
        } catch {
            fileStorage = getSupportedFileStorage({ tryOPFS: false });
            logger.info(`[fs::OPFS] OPFS not supported - switching to ${fileStorage.type}`);
        } finally {
            fileStorageReady.resolve(true);
        }
    }
})().catch(noop);
