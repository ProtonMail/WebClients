import { isSafari } from '@proton/shared/lib/helpers/browser';

import { FileStorageIDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

const isOPFSSupported = () => !isSafari() && Boolean(navigator.storage && navigator.storage.getDirectory);

export const fileStorage: FileStorage = isOPFSSupported() ? new FileStorageOPFS() : new FileStorageIDB();
