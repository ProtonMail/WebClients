import { isSafari } from '@proton/shared/lib/helpers/browser';

import { FileStorageIDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

const isOPFSSupported = () => !isSafari() && Boolean(navigator.storage && navigator.storage.getDirectory);

export const fileStorage: FileStorage = isOPFSSupported() ? new FileStorageOPFS() : new FileStorageIDB();

const PENDING_REMOVALS = new Map<string, NodeJS.Timeout>();

export const autoRemove = (filename: string, size: number) => {
    const pending = PENDING_REMOVALS.get(filename);

    if (pending) {
        clearTimeout(pending);
        PENDING_REMOVALS.delete(filename);
    }

    /** Timeout calculation balances download time (1sec/50MB) and
     * user interaction time (30sec), with a 2min maximum cap */
    const downloadBuffer = (size / (50 * 1024 * 1024)) * 1_000;
    const userInteractionBuffer = 30_000;
    const maxTimeout = 120_000;

    const timeout = Math.min(Math.max(downloadBuffer, userInteractionBuffer), maxTimeout);

    PENDING_REMOVALS.set(
        filename,
        setTimeout(() => fileStorage.deleteFile(filename), timeout)
    );
};
