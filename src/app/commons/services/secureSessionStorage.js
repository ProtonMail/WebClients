import createSecureSessionStorage from 'proton-shared/lib/secureSessionStorage';
import { MAILBOX_PASSWORD_KEY, UID_KEY } from 'proton-shared/lib/constants';
import { EO_DECRYPTED_TOKEN_KEY, EO_PASSWORD_KEY } from '../../constants';

const SECURE_SESSION_STORAGE_KEYS = [MAILBOX_PASSWORD_KEY, UID_KEY, EO_DECRYPTED_TOKEN_KEY, EO_PASSWORD_KEY];

/* @ngInject */
function secureSessionStorage() {
    return createSecureSessionStorage(SECURE_SESSION_STORAGE_KEYS);
}

export default secureSessionStorage;
