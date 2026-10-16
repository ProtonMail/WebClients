import { ARGON2_PARAMS } from '@protontech/crypto';

import { generateClientKey } from '@proton/shared/lib/authentication/clientKey';
import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { LockMode } from '../../../lib/auth/lock/types';
import type { AuthSession } from '../../../lib/auth/session';
import { encryptPersistedSessionWithKey } from '../../../lib/auth/session';
import type { OfflineComponents } from '../../../lib/cache/crypto';
import { CACHE_SALT_LENGTH, getOfflineKeyDerivation, getOfflineVerifier } from '../../../lib/cache/crypto';

export const TEST_OFFLINE_PASSWORD = 'offline-password';

/** Real Argon2, requires `setupCryptoProxyForTesting`. The password unlock reads
 * the params back from `offlineConfig`: the cheapest preset keeps tests fast. */
export const createTestOfflineComponents = async (password = TEST_OFFLINE_PASSWORD): Promise<OfflineComponents> => {
    const salt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));
    const params = ARGON2_PARAMS.MINIMUM;
    const offlineKD = await getOfflineKeyDerivation(password, salt, params);

    return {
        offlineConfig: { salt: uint8ArrayToBinaryString(salt), params },
        offlineKD: uint8ArrayToBinaryString(offlineKD),
        offlineVerifier: await getOfflineVerifier(offlineKD),
    };
};

export const createTestSession = (session: Partial<AuthSession> = {}): AuthSession => ({
    AccessToken: 'test-access-token',
    keyPassword: 'test-key-password',
    lockMode: LockMode.NONE,
    payloadVersion: 1,
    persistent: true,
    RefreshToken: 'test-refresh-token',
    sso: false,
    UID: 'test-uid',
    UserID: 'test-user-id',
    ...session,
});

export type TestPersistedSession = {
    /** Served by the backend on `auth/v4/sessions/local/key` to decrypt `encrypted` */
    clientKey: string;
    encrypted: string;
    session: AuthSession;
};

export const createTestPersistedSession = async (session: AuthSession): Promise<TestPersistedSession> => {
    const { key, serializedData } = await generateClientKey();
    const encrypted = await encryptPersistedSessionWithKey(session, key);

    return { clientKey: serializedData, encrypted, session };
};
