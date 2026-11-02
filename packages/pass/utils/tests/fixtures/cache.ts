import { CryptoProxy } from '@protontech/crypto';

import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Key } from '@proton/shared/lib/interfaces/Key';
import type { User } from '@proton/shared/lib/interfaces/User';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces/UserSettings';

import { generateCache } from '../../../lib/cache/generate';
import { PassCrypto, exposePassCrypto } from '../../../lib/crypto';
import { createPassCrypto } from '../../../lib/crypto/pass-crypto';
import type { State } from '../../../store/types';
import type { PassPlanResponse } from '../../../types/api/pass';
import { PlanType } from '../../../types/api/pass';
import type { Share, ShareType } from '../../../types/data/shares';
import { uniqueId } from '../../string/unique-id';
import { createTestState } from '../state';
import { TEST_USER_KEY_ID, createRandomKey, createRandomShareResponses, randomAddress } from './crypto';
import type { TestLoginInit } from './items';
import { createTestLogin } from './items';
import { createTestVault } from './shares';

/** The cache key derivation rejects short secrets: same length as the bcrypt-derived key password */
const TEST_CACHE_KEY_PASSWORD = 'k'.repeat(31);

/** Requires `setupCryptoProxyForTesting`. Hydrates a fresh `PassCrypto` with a
 * real user key and address key, so shares registered on it can be serialized
 * into a cache snapshot (`generateCache`) and opened again from it. */
export const hydrateTestPassCrypto = async () => {
    const userKey = await createRandomKey();
    const addressKey = await createRandomKey();

    const user = {
        ID: 'test-user-id',
        Name: 'test-user',
        DisplayName: 'Test User',
        Email: 'user@example.com',
        Flags: { sso: false },
        Keys: [
            {
                ID: TEST_USER_KEY_ID,
                PrivateKey: await CryptoProxy.exportPrivateKey({
                    privateKey: userKey.privateKey,
                    passphrase: TEST_CACHE_KEY_PASSWORD,
                }),
                Version: 3,
                Active: 1,
            } as Key,
        ],
    } as User;

    const address: Address = {
        ...randomAddress(),
        ID: `addressId-${uniqueId()}`,
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
        Keys: [
            {
                ID: `addressId-key-${uniqueId()}`,
                PrivateKey: await CryptoProxy.exportPrivateKey({
                    format: 'armored',
                    privateKey: addressKey.privateKey,
                    passphrase: TEST_CACHE_KEY_PASSWORD,
                }),
                Primary: 1,
                Active: 1,
                Fingerprint: '',
                Fingerprints: [],
                Version: 1,
                Flags: 0,
                Signature: '',
                AddressForwardingID: '',
            },
        ],
    };

    exposePassCrypto(createPassCrypto());
    await PassCrypto.hydrate({ user, addresses: [address], keyPassword: TEST_CACHE_KEY_PASSWORD });

    return { user, address, userKey, keyPassword: TEST_CACHE_KEY_PASSWORD };
};

type TestCryptoUser = Awaited<ReturnType<typeof hydrateTestPassCrypto>>;

/** Registers a share manager on the hydrated `PassCrypto` and returns the matching
 * state share: the cache sanitizer drops shares without a share manager. */
export const registerTestVault = async (
    { userKey, address }: Pick<TestCryptoUser, 'userKey' | 'address'>,
    name: string
): Promise<Share<ShareType.Vault>> => {
    const [encryptedShare, shareKey] = await createRandomShareResponses(userKey, userKey, address.ID);
    await PassCrypto.openShare({ encryptedShare, encryptedShareKeys: [shareKey] });
    return createTestVault({ name, shareId: encryptedShare.ShareID, vaultId: encryptedShare.VaultID! });
};

type TestCacheInit = {
    cryptoUser: TestCryptoUser;
    offlineKD: string;
    vaultName?: string;
    logins?: Omit<TestLoginInit, 'shareId'>[];
};

/** Encrypted cache of a booted user: a hydrated user state (so a boot from this cache
 * never queries the user), one vault and its logins. The cache key is wrapped with
 * `offlineKD`, as the offline unlock expects. */
export const createTestCache = async ({
    cryptoUser,
    offlineKD,
    vaultName = 'Personal',
    logins = [],
}: TestCacheInit) => {
    const { user, address, keyPassword } = cryptoUser;
    const vault = await registerTestVault(cryptoUser, vaultName);
    const items = logins.map((login) => createTestLogin({ ...login, shareId: vault.shareId }));

    const state = createTestState({
        shares: [vault],
        items,
        features: {},
        featureVariants: {},
        user: {
            user,
            addresses: { [address.ID]: address },
            eventId: 'test-event-id',
            plan: { Type: PlanType.PLUS } as PassPlanResponse,
            userSettings: { Password: { Mode: SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE } } as NonNullable<
                State['user']['userSettings']
            >,
        },
    });

    const encrypted = await generateCache({ keyPassword, offlineKD })(state);
    return { encrypted, vault, items };
};
