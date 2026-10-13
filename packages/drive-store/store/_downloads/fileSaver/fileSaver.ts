import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { getCookie } from '@proton/shared/lib/helpers/cookies';

import { isServiceWorkersUnsupported } from './download';

const isOPFSSupported = async () => {
    // Get the OPFS root directory
    // Firefox has a bug where sometimes it fails to getDirectoy
    // DOMException: Security error when calling GetDirectory
    // Considered we haven't started the download yet, we fallback to SW download
    // https://webcompat.com/issues/128011
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1875283
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1942530
    try {
        await navigator.storage.getDirectory();
        return !isSafari() && !isMobile();
    } catch {
        return false;
    }
};

const getMemoryLimit = () => {
    // Default limit for in-memory downloads is 500MB for Desktop and 100MB on Mobile as per MEMORY_DOWNLOAD_LIMIT
    return MEMORY_DOWNLOAD_LIMIT;
};

const hasEnoughOPFSStorage = async (size?: number): Promise<boolean> => {
    if (size && typeof navigator.storage !== 'undefined' && typeof navigator.storage.estimate !== 'undefined') {
        // https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota || 0) - (estimate.usage || 0);
        // We verify the estimates can hold up to twice the size of the file
        // Moving a file from OPFS to user FS is like making a copy so must holds the file twice
        return available > size * 2;
    }
    return false;
};

// FileSaver provides functionality to start download to file. This class does
// not deal with API or anything else. Files which fit the memory (see
// MEMORY_DOWNLOAD_LIMIT constant) are buffered in browser and then saved in
// one go. Bigger files are streamed and user can see the progress almost like
// it would be normal file. See saveViaDownload for more info.
class FileSaver {
    useBlobFallback: boolean = false;

    useSWFallback: boolean = false;

    async selectMechanismForDownload(size?: number): Promise<'memory' | 'opfs' | 'sw' | 'memory_fallback'> {
        /** For E2E usage we need to enforce a certain mechanism and test all mechanism without any limits */
        const cookie = getCookie('DriveE2EDownloadMechanism');
        if (cookie && ['memory', 'opfs', 'sw'].includes(cookie)) {
            return cookie as 'memory' | 'opfs' | 'sw';
        }

        const limit = getMemoryLimit();
        if (size && size < limit) {
            return 'memory';
        }

        // https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
        if ((await isOPFSSupported()) && this.useSWFallback === false && (await hasEnoughOPFSStorage(size))) {
            return 'opfs';
        }

        if (this.useBlobFallback === true || isServiceWorkersUnsupported()) {
            return 'memory_fallback';
        }

        return 'sw';
    }
}

const fileSaverSingleton = {
    _instance: undefined as FileSaver | undefined,
    get instance() {
        if (!this._instance) {
            this._instance = new FileSaver();
        }
        return this._instance;
    },
};

export default fileSaverSingleton;
