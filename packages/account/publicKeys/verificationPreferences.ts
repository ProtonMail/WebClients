import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import getPublicKeysVcardHelper from '@proton/shared/lib/api/helpers/getPublicKeysVcardHelper';
import { ADDRESS_STATUS, KEY_FLAG, MINUTE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { canonicalizeEmail, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { KT_VERIFICATION_STATUS } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { VerificationPreferences } from '@proton/shared/lib/interfaces/VerificationPreferences';
import type { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';
import { splitKeys } from '@proton/shared/lib/keys';
import { getActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { getVerifyingKeys } from '@proton/shared/lib/keys/publicKeys';
import { type Record, getPromiseValue } from '@proton/shared/lib/models/cache';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import type { UserState } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { getPublicKeysForInboxThunk } from './publicKeysForInbox';

const DEFAULT_LIFETIME = 5 * MINUTE;

const cache = new Map<string, Record<VerificationPreferences>>();

const getVerificationPreferencesThunkHelper = ({
    email,
    lifetime = DEFAULT_LIFETIME,
    contactEmailsMap,
}: Parameters<GetVerificationPreferences>[0]): ThunkAction<
    ReturnType<GetVerificationPreferences>,
    KtState & AddressKeysState & UserState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const { api } = extra;

        const addresses = await dispatch(addressesThunk());
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
            const selfAddressKeys = await dispatch(addressKeysThunk({ addressID: selfAddress.ID }));
            const activeAddressKeysByVersion = await getActiveAddressKeys(selfAddress.SignedKeyList, selfAddressKeys);
            // for verification, the order of the keys does not currently matter, but we put v6 keys first as ideally v6 signatures should take precedence
            const activeAddressKeys = [...activeAddressKeysByVersion.v6, ...activeAddressKeysByVersion.v4];
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
        } = await dispatch(
            getPublicKeysForInboxThunk({
                email,
                lifetime,
                // messages from internal senders with e2ee disabled are still signed, thus we need to fetch the corresponding verification keys
                includeInternalKeysWithE2EEDisabledForMail: true,
                // untrusted WKD keys are not used for verification, and requesting WKD keys leaks to the sender's domain owner that the message has been read.
                internalKeysOnly: true,
            })
        );
        const isInternal = RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
        const { publicKeys: contactVerificationKeys } = splitKeys(await dispatch(userKeysThunk()));
        const { pinnedKeys, isContactSignatureVerified: pinnedKeysVerified } = await getPublicKeysVcardHelper(
            api,
            email,
            contactVerificationKeys,
            isInternal,
            contactEmailsMap
        );
        const compromisedKeysFingerprints = new Set(
            apiKeys
                .filter(({ flags }) => !hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
                .map(({ publicKey }) => publicKey!.getFingerprint())
        );
        const pinnedKeysFingerprints = new Set(pinnedKeys.map((key) => key.getFingerprint()));
        const apiPublicKeys = apiKeys
            .filter(({ publicKey }) => !!publicKey)
            .map(({ publicKey }) => publicKey)
            // for verification, the order of the keys does not currently matter, but we put v6 keys first as ideally v6 signatures should take precedence
            .sort((publicKeyA, publicKeyB) => publicKeyB.getVersion() - publicKeyA.getVersion());

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
    };
};

export const getVerificationPreferencesThunk = ({
    email,
    lifetime = DEFAULT_LIFETIME,
    contactEmailsMap,
}: Parameters<GetVerificationPreferences>[0]): ThunkAction<
    ReturnType<GetVerificationPreferences>,
    KtState & AddressKeysState & UserState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        // By normalizing email here, we consider that it could not exists different encryption preferences
        // For 2 addresses identical but for the cases.
        // If a provider does different one day, this would have to evolve.
        const canonicalEmail = canonicalizeEmail(email);

        const miss = () =>
            dispatch(
                getVerificationPreferencesThunkHelper({
                    email: canonicalEmail,
                    lifetime,
                    contactEmailsMap,
                })
            );

        return getPromiseValue(cache, canonicalEmail, miss, lifetime);
    };
};
