import { getAddressKeyPassword, getDecryptedAddressKey } from '@proton/shared/lib/keys/addressKeys';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { captureMessage } from '../helpers/sentry';
import type { DecryptedAddressKey, KeyPair, User, AddressKey as tsAddressKey } from '../interfaces';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';
import { splitKeys } from './keys';

export const getDecryptedAddressKeys = async (
    addressKeys: tsAddressKey[] = [],
    userKeys: KeyPair[] = [],
    keyPassword: string,
    organizationKey?: KeyPair
): Promise<DecryptedAddressKey[]> => {
    if (!addressKeys.length || !userKeys.length) {
        return [];
    }

    const userKeysPair = splitKeys(userKeys);

    // there can be either one or two primary keys (with v6 keys enabled), but in this context checking one
    // of them is sufficient.
    const [primaryKey, ...restKeys] = addressKeys;
    if (primaryKey.Primary !== 1) {
        // we avoid throwing an error for now; we first want to monitor if there exists some users
        // (with broken setup) who would be impacted
        captureMessage(
            addressKeys.find(({ Primary }) => Primary === 1)
                ? 'getDecryptedAddressKeys: missing Primary flag in first address key'
                : 'getDecryptedAddressKeys: missing Primary flag in address keys',
            { level: 'info' }
        );
    }

    const primaryKeyResult = await getAddressKeyPassword(primaryKey, userKeysPair, keyPassword, organizationKey)
        .then((password) => getDecryptedAddressKey(primaryKey, password))
        .catch(noop);

    // In case the primary key fails to decrypt, something is broken, so don't even try to decrypt the rest of the keys.
    if (!primaryKeyResult) {
        return [];
    }

    const restKeyResults = await Promise.all(
        restKeys.map((restKey) => {
            return getAddressKeyPassword(restKey, userKeysPair, keyPassword, organizationKey)
                .then((password) => getDecryptedAddressKey(restKey, password))
                .catch(noop);
        })
    );

    return [primaryKeyResult, ...restKeyResults].filter(isTruthy);
};
export const getDecryptedAddressKeysHelper = async (
    addressKeys: tsAddressKey[] = [],
    user: User,
    userKeys: KeyPair[] = [],
    keyPassword: string
): Promise<DecryptedAddressKey[]> => {
    if (!user.OrganizationPrivateKey) {
        return getDecryptedAddressKeys(addressKeys, userKeys, keyPassword);
    }

    const { OrganizationPrivateKey } = user;

    const organizationKey = OrganizationPrivateKey
        ? await getDecryptedOrganizationKey(OrganizationPrivateKey, keyPassword).catch(noop)
        : undefined;
    // When signed into a non-private member, if the organization key can't be decrypted, the rest
    // of the keys won't be able to get decrypted
    if (!organizationKey) {
        return [];
    }
    return getDecryptedAddressKeys(addressKeys, userKeys, keyPassword, organizationKey);
};
