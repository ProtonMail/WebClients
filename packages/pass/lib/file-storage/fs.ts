import { FileStorageStub } from '@proton/pass/lib/file-storage/fs.stub';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { FileStorageIDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

/** isSafari() works on web app but not on extension
 * background script, so we have to use BUILD_TARGET */
const isOPFSSupported = () =>
    BUILD_TARGET !== 'safari' && !isSafari() && Boolean(navigator.storage && navigator.storage.getDirectory);

export const fileStorage: FileStorage = (() => {
    if (isOPFSSupported()) return new FileStorageOPFS();
    if ('indexedDB' in globalThis) return new FileStorageIDB();
    return new FileStorageStub();
})();
