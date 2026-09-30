const KEY_PREFIX = 'upload-client-uid';

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
    return result === 'failed';
}

/**
 * getStorageKey generates key to be used for local storage.
 * Key should be unique enough to not be conflict with anything else.
 */
function getStorageKey(uid: string) {
    return `${KEY_PREFIX}-${uid}`;
}
