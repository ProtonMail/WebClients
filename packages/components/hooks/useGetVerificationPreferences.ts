import { useCallback } from 'react';

import { PublicKeyReference } from '@proton/crypto';
import getPublicKeysVcardHelper from '@proton/shared/lib/api/helpers/getPublicKeysVcardHelper';
import { KEY_FLAG, MINUTE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { canonicalizeEmail, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { ApiKeysConfig, KT_VERIFICATION_STATUS } from '@proton/shared/lib/interfaces';
import { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';
import { splitKeys } from '@proton/shared/lib/keys';
import { getActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { getVerifyingKeys } from '@proton/shared/lib/keys/publicKeys';

import { useGetAddresses } from './useAddresses';
import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import { useGetAddressKeys } from './useGetAddressKeys';
import useGetPublicKeys from './useGetPublicKeys';
import { useGetMailSettings } from './useMailSettings';
import { useGetUserKeys } from './useUserKeys';

export const CACHE_KEY = 'VERIFICATION_PREFERENCES';

const DEFAULT_LIFETIME = 5 * MINUTE;

/**
 * Given an email address and the user mail settings, return the verification preferences for verifying messages
 * from that email address.
 */
const useGetVerificationPreferences = () => {
    const api = useApi();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getPublicKeys = useGetPublicKeys();
    const getMailSettings = useGetMailSettings();

    const getVerificationPreferences = useCallback<GetVerificationPreferences>(
        async (emailAddress, lifetime, contactEmailsMap) => {
            const addresses = await getAddresses();
            const canonicalEmail = canonicalizeInternalEmail(emailAddress);
            const selfAddress = addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalEmail);
            if (selfAddress) {
                const selfAddressKeys = await getAddressKeys(selfAddress.ID);
                const activeAddressKeys = await getActiveKeys(
                    selfAddress,
                    selfAddress.SignedKeyList,
                    selfAddress.Keys,
                    selfAddressKeys
                );
                const activePublicKeys = activeAddressKeys.map(({ publicKey }) => publicKey);
                const compromisedFingerprints = new Set(
                    activeAddressKeys
                        .filter(({ flags }) => !hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
                        .map(({ fingerprint }) => fingerprint)
                );
                const verifyingKeys = getVerifyingKeys(activePublicKeys, compromisedFingerprints);
                return {
                    isOwnAddress: true,
                    verifyingKeys,
                    apiKeys: activePublicKeys,
                    pinnedKeys: [],
                    compromisedFingerprints,
                    ktVerificationResult: { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS },
                };
            }
            const {
                RecipientType,
                publicKeys: apiKeys,
                ktVerificationResult,
                Errors,
            }: ApiKeysConfig = await getPublicKeys(emailAddress, lifetime);
            const isInternal = RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
            const { publicKeys } = splitKeys(await getUserKeys());
            const { pinnedKeys, isContactSignatureVerified: pinnedKeysVerified } = await getPublicKeysVcardHelper(
                api,
                emailAddress,
                publicKeys,
                isInternal,
                contactEmailsMap
            );
            const compromisedKeysFingerprints = new Set(
                apiKeys
                    .filter(({ flags }) => !hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
                    .map(({ publicKey }) => publicKey!.getFingerprint())
            );
            const pinnedKeysFingerprints = new Set(pinnedKeys.map((key) => key.getFingerprint()));
            const apiPublicKeys = apiKeys.filter(({ publicKey }) => !!publicKey).map(({ publicKey }) => publicKey!);
            let verifyingKeys: PublicKeyReference[] = [];
            if (pinnedKeys.length) {
                verifyingKeys = getVerifyingKeys(pinnedKeys, compromisedKeysFingerprints);
            } else if (isInternal && ktVerificationResult?.status === KT_VERIFICATION_STATUS.VERIFIED_KEYS) {
                verifyingKeys = getVerifyingKeys(apiPublicKeys, compromisedKeysFingerprints);
            }
            return {
                isOwnAddress: false,
                verifyingKeys,
                pinnedKeys,
                apiKeys: apiPublicKeys,
                ktVerificationResult,
                pinnedKeysFingerprints,
                compromisedKeysFingerprints,
                pinnedKeysVerified,
                apiKeysErrors: Errors,
            };
        },
        [api, getAddressKeys, getAddresses, getPublicKeys, getMailSettings]
    );

    return useCallback<GetVerificationPreferences>(
        (email, lifetime = DEFAULT_LIFETIME, contactEmailsMap) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            // By normalizing email here, we consider that it could not exists different encryption preferences
            // For 2 addresses identical but for the cases.
            // If a provider does different one day, this would have to evolve.
            const canonicalEmail = canonicalizeEmail(email);
            const miss = () => getVerificationPreferences(canonicalEmail, lifetime, contactEmailsMap);
            return getPromiseValue(subCache, canonicalEmail, miss, lifetime);
        },
        [cache, getVerificationPreferences]
    );
};

export default useGetVerificationPreferences;
