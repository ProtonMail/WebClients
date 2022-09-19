import { useCallback } from 'react';

import getPublicKeysVcardHelper from '@proton/shared/lib/api/helpers/getPublicKeysVcardHelper';
import { MINUTE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import { canonizeEmail, canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { GetEncryptionPreferences } from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';
import { getKeyHasFlagsToEncrypt } from '@proton/shared/lib/keys';
import { getActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { getContactPublicKeyModel, getKeyEncryptionCapableStatus } from '@proton/shared/lib/keys/publicKeys';
import extractEncryptionPreferences from '@proton/shared/lib/mail/encryptionPreferences';

import { useGetAddresses } from './useAddresses';
import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import { useGetAddressKeys } from './useGetAddressKeys';
import useGetPublicKeys from './useGetPublicKeys';
import { useGetMailSettings } from './useMailSettings';
import { useGetUserKeys } from './useUserKeys';

export const CACHE_KEY = 'ENCRYPTION_PREFERENCES';

const DEFAULT_LIFETIME = 5 * MINUTE;

/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'
 */
const useGetEncryptionPreferences = () => {
    const api = useApi();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getPublicKeys = useGetPublicKeys();
    const getMailSettings = useGetMailSettings();

    const getEncryptionPreferences = useCallback<GetEncryptionPreferences>(
        async (emailAddress, lifetime, contactEmailsMap) => {
            const [addresses, mailSettings] = await Promise.all([getAddresses(), getMailSettings()]);
            const canonicalEmail = canonizeInternalEmail(emailAddress);
            const selfAddress = getSelfSendAddresses(addresses).find(
                ({ Email }) => canonizeInternalEmail(Email) === canonicalEmail
            );
            let selfSend;
            let apiKeysConfig;
            let pinnedKeysConfig;
            if (selfAddress) {
                // we do not trust the public keys in ownAddress (they will be deprecated in the API response soon anyway)
                const selfAddressKeys = await getAddressKeys(selfAddress.ID);
                const primaryAddressKey = (
                    await getActiveKeys(selfAddress, selfAddress.SignedKeyList, selfAddress.Keys, selfAddressKeys)
                )[0];
                const selfPublicKey = primaryAddressKey?.publicKey;
                const canEncrypt = selfPublicKey ? await getKeyEncryptionCapableStatus(selfPublicKey) : undefined;
                const canSend = canEncrypt && getKeyHasFlagsToEncrypt(primaryAddressKey.flags);
                selfSend = { address: selfAddress, publicKey: selfPublicKey, canSend };
                // For own addresses, we use the decrypted keys in selfSend and do not fetch any data from the API
                apiKeysConfig = { Keys: [], publicKeys: [], RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL };
                pinnedKeysConfig = { pinnedKeys: [], isContact: false };
            } else {
                const { publicKeys } = splitKeys(await getUserKeys());
                apiKeysConfig = await getPublicKeys(emailAddress, lifetime, !lifetime);
                const isInternal = apiKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
                pinnedKeysConfig = await getPublicKeysVcardHelper(
                    api,
                    emailAddress,
                    publicKeys,
                    isInternal,
                    contactEmailsMap
                );
            }
            const publicKeyModel = await getContactPublicKeyModel({
                emailAddress,
                apiKeysConfig,
                pinnedKeysConfig,
            });
            return extractEncryptionPreferences(publicKeyModel, mailSettings, selfSend);
        },
        [api, getAddressKeys, getAddresses, getPublicKeys, getMailSettings]
    );

    return useCallback<GetEncryptionPreferences>(
        (email, lifetime = DEFAULT_LIFETIME, contactEmailsMap) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            // By normalizing email here, we consider that it could not exists different encryption preferences
            // For 2 addresses identical but for the cases.
            // If a provider does different one day, this would have to evolve.
            const canonicalEmail = canonizeEmail(email);
            const miss = () => getEncryptionPreferences(canonicalEmail, lifetime, contactEmailsMap);
            return getPromiseValue(subCache, canonicalEmail, miss, lifetime);
        },
        [cache, getEncryptionPreferences]
    );
};

export default useGetEncryptionPreferences;
