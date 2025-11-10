import * as storage from '@proton/shared/lib/helpers/storage';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

const CLIENT_UID_STORAGE_KEY = 'proton-drive-client-uid';

export function getClientUid(): string {
    // Storage helpers already wraps the calls in try/catch and returns undefined on error.

    const result = storage.getItem(CLIENT_UID_STORAGE_KEY);
    if (result) {
        return result;
    }

    const clientUid = generateProtonWebUID();
    storage.setItem(CLIENT_UID_STORAGE_KEY, clientUid);
    return clientUid;
}
