import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

import { sendErrorReport } from '../../../utils/errorHandling';

enum UploadingState {
    // File is being uploading - do not automatically replace file.
    Uploading = 'uploading',
    // File upload either failed or user closed the tab before upload
    // finish - automatic replace is safe.
    Failed = 'failed',
}

/**
 * generateClientUid generates new client UID and two callbacks.
 * One to be called when file is uploaded - that will remove the UID
 * from local storage as it is not needed anymore.
 * Second to be called when file failed to be uplaoded - that will
 * change the state of the uploading UID in local storage to indicate
 * it is safe to automatically replace the file draft.
 * Note it will automatically set failed state when page is unloaded.
 */
export function generateClientUid(clientUid?: string) {
    // When the file is being replaced, we want to reuse the same UID
    // so it is properly removed from the local storage after successfull
    // upload.
    if (!clientUid) {
        clientUid = generateProtonWebUID();
    }
    const key = getStorageKey(clientUid);

    // LocalStorage can fail when setting values, which will fail the
    // transfer. We can ignore this.
    //
    // The worst case scenario would be not knowing the state, but it's
    // better to at least upload the file than fail here.
    try {
        localStorage.setItem(key, UploadingState.Uploading);
    } catch (e) {
        sendErrorReport(e);
    }

    const uploadFailed = () => {
        try {
            localStorage.setItem(key, UploadingState.Failed);
        } catch (e) {
            sendErrorReport(e);
        }
        removeEventListener('unload', uploadFailed);
    };

    const uploadFinished = () => {
        localStorage.removeItem(key);
        removeEventListener('unload', uploadFailed);
    };

    // If file is not finished and page is closed, we consider it
    // as failed upload which is safe to automatically replace with
    // next upload attempt by the user.
    addEventListener('unload', uploadFailed);

    return {
        clientUid,
        uploadFailed,
        uploadFinished,
    };
}

/**
 * isClientUidAvailable returns true only if the client UID is known
 * by the client and file failed to be uploaded, that is we are sure
 * it is safe to automatically replace.
 * If the file is still being uploaded or is not known by the client,
 * user needs to be notified about it and asked what to do.
 */
export function isClientUidAvailable(clientUid: string): boolean {
    const key = getStorageKey(clientUid);
    const result = localStorage.getItem(key);
    return result === UploadingState.Failed;
}

/**
 * getStorageKey generates key to be used for local storage.
 * Key should be unique enough to not be conflict with anything else.
 */
function getStorageKey(uid: string) {
    return `upload-client-uid-${uid}`;
}
