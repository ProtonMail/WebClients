import { useCallback } from 'react';

import { useGetMailSettings } from '@proton/mail/mailSettings/hooks';
import getPublicKeysVcardHelper from '@proton/shared/lib/api/helpers/getPublicKeysVcardHelper';
import { MINUTE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmail, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { ApiKeysConfig, PinnedKeysConfig, SelfSend } from '@proton/shared/lib/interfaces';
import { KT_VERIFICATION_STATUS } from '@proton/shared/lib/interfaces';
import type { GetEncryptionPreferences } from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';
import { getKeyHasFlagsToEncrypt } from '@proton/shared/lib/keys';
import { getActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { getContactPublicKeyModel, getKeyEncryptionCapableStatus } from '@proton/shared/lib/keys/publicKeys';
import extractEncryptionPreferences from '@proton/shared/lib/mail/encryptionPreferences';

import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useAddressesKeys';
import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import useGetPublicKeysForInbox from './useGetPublicKeysForInbox';
import { useGetUserKeys } from './useUserKeys';

export const CACHE_KEY = 'ENCRYPTION_PREFERENCES';

const DEFAULT_LIFETIME = 5 * MINUTE;

/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'.
 * NB: the current logic does not handle internal address keys belonging to external accounts, since these keys are not used by Inbox.
 */
const useGetEncryptionPreferences = () => {
    const api = useApi();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const getMailSettings = useGetMailSettings();

    const getEncryptionPreferences = useCallback<GetEncryptionPreferences>(
        async ({ email, lifetime, contactEmailsMap, intendedForEmail = true }) => {
            const [addresses, mailSettings] = await Promise.all([getAddresses(), getMailSettings()]);
            const canonicalEmail = canonicalizeInternalEmail(email);
            const selfAddress = getSelfSendAddresses(addresses).find(
                ({ Email }) => canonicalizeInternalEmail(Email) === canonicalEmail
            );
            let selfSend: SelfSend | undefined;
            let apiKeysConfig: ApiKeysConfig;
            let pinnedKeysConfig: PinnedKeysConfig;
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
                apiKeysConfig = {
                    publicKeys: [],
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    ktVerificationResult: { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS },
                };
                pinnedKeysConfig = { pinnedKeys: [], isContact: false };
            } else {
                const { publicKeys } = splitKeys(await getUserKeys());
                apiKeysConfig = await getPublicKeysForInbox({
                    email,
                    internalKeysOnly: intendedForEmail === false,
                    includeInternalKeysWithE2EEDisabledForMail: intendedForEmail === false,
                    lifetime,
                    noCache: !lifetime,
                });
                const isInternal = apiKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
                pinnedKeysConfig = await getPublicKeysVcardHelper(api, email, publicKeys, isInternal, contactEmailsMap);
            }
            const publicKeyModel = await getContactPublicKeyModel({
                emailAddress: email,
                apiKeysConfig,
                pinnedKeysConfig,
            });
            return extractEncryptionPreferences(publicKeyModel, mailSettings, selfSend);
        },
        [api, getAddressKeys, getAddresses, getPublicKeysForInbox, getMailSettings]
    );

    return useCallback<GetEncryptionPreferences>(
        ({ email, lifetime = DEFAULT_LIFETIME, contactEmailsMap, intendedForEmail }) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            // By normalizing email here, we consider that it could not exist different encryption preferences
            // For 2 addresses identical but for the cases.
            // If a provider does different one day, this would have to evolve.
            const canonicalEmail = canonicalizeEmail(email);
            const miss = () =>
                getEncryptionPreferences({
                    email: canonicalEmail,
                    intendedForEmail,
                    lifetime,
                    contactEmailsMap,
                });
            return getPromiseValue(subCache, canonicalEmail, miss, lifetime);
        },
        [cache, getEncryptionPreferences]
    );
};

export default useGetEncryptionPreferences;
