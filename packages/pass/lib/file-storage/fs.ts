import { isSafari } from '@proton/shared/lib/helpers/browser';

import { FileStorageIDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

// isSafari() works on web app but not on extension background script, so we have to use BUILD_TARGET too
const isOPFSSupported = () =>
    BUILD_TARGET !== 'safari' && !isSafari() && Boolean(navigator.storage && navigator.storage.getDirectory);

export const fileStorage: FileStorage = isOPFSSupported() ? new FileStorageOPFS() : new FileStorageIDB();
