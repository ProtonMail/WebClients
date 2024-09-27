import { useCallback } from 'react';

import type { PublicKeyReference } from '@proton/crypto';
import { useGetMailSettings } from '@proton/mail/mailSettings/hooks';
import getPublicKeysVcardHelper from '@proton/shared/lib/api/helpers/getPublicKeysVcardHelper';
import { ADDRESS_STATUS, KEY_FLAG, MINUTE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { canonicalizeEmail, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { ApiKeysConfig } from '@proton/shared/lib/interfaces';
import { KT_VERIFICATION_STATUS } from '@proton/shared/lib/interfaces';
import type { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';
import { splitKeys } from '@proton/shared/lib/keys';
import { getActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { getVerifyingKeys } from '@proton/shared/lib/keys/publicKeys';

import { useGetAddresses } from './useAddresses';
import { useGetAddressKeys } from './useAddressesKeys';
import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';
import useGetPublicKeysForInbox from './useGetPublicKeysForInbox';
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
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const getMailSettings = useGetMailSettings();

    const getVerificationPreferences = useCallback<GetVerificationPreferences>(
        async ({ email, lifetime, contactEmailsMap }) => {
            const addresses = await getAddresses();
            const canonicalEmail = canonicalizeInternalEmail(email);
            // Disabled addresses might now belong to other users (internal or external), who reused them.
            // Since own keys take precedence on verification, but the message might be signed by a new/different address owner,
            // we want to avoid considering disabled addresses as own addresses, in order to successfully verify messages sent by
            // different owners.
            // As a result, however, verification will fail for messages who were indeed sent from the disabled address.
            // This downside has been deemed acceptable, since it aligns with the more general issue (to be tackled separately)
            // of needing to preserve  the message verification status at the time when a message is first read, regardless of
            // any subsequent public key changes (for non-pinned keys).
            const selfAddress = addresses
                .filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED)
                .find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalEmail);
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
            }: ApiKeysConfig = await getPublicKeysForInbox({
                email,
                lifetime,
                // messages from internal senders with e2ee disabled are still signed, thus we need to fetch the corresponding verification keys
                includeInternalKeysWithE2EEDisabledForMail: true,
                // untrusted WKD keys are not used for verification, and requesting WKD keys leaks to the sender's domain owner that the message has been read.
                internalKeysOnly: true,
            });
            const isInternal = RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
            const { publicKeys } = splitKeys(await getUserKeys());
            const { pinnedKeys, isContactSignatureVerified: pinnedKeysVerified } = await getPublicKeysVcardHelper(
                api,
                email,
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
        [api, getAddressKeys, getAddresses, getPublicKeysForInbox, getMailSettings]
    );

    return useCallback<GetVerificationPreferences>(
        ({ email, lifetime = DEFAULT_LIFETIME, contactEmailsMap }) => {
            if (!cache.has(CACHE_KEY)) {
                cache.set(CACHE_KEY, new Map());
            }
            const subCache = cache.get(CACHE_KEY);
            // By normalizing email here, we consider that it could not exists different encryption preferences
            // For 2 addresses identical but for the cases.
            // If a provider does different one day, this would have to evolve.
            const canonicalEmail = canonicalizeEmail(email);
            const miss = () => getVerificationPreferences({ email: canonicalEmail, lifetime, contactEmailsMap });
            return getPromiseValue(subCache, canonicalEmail, miss, lifetime);
        },
        [cache, getVerificationPreferences]
    );
};

export default useGetVerificationPreferences;
