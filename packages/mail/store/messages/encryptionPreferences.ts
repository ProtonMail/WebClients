import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { type AddressKeysState, addressKeysThunk } from '@proton/account/addressKeys';
import { addressesThunk } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import { getPublicKeysForInboxThunk } from '@proton/account/publicKeys/publicKeysForInbox';
import { type UserKeysState, userKeysThunk } from '@proton/account/userKeys';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import getPublicKeysVcardHelper from '@proton/shared/lib/api/helpers/getPublicKeysVcardHelper';
import { MINUTE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getSelfSendAddresses } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmail, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { ApiKeysConfig, PinnedKeysConfig, SelfSend } from '@proton/shared/lib/interfaces';
import { KT_VERIFICATION_STATUS } from '@proton/shared/lib/interfaces';
import type {
    GetEncryptionPreferencesArguments,
    GetEncryptionPreferencesResult,
} from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';
import { getKeyHasFlagsToEncrypt, getPrimaryActiveAddressKeyForEncryption } from '@proton/shared/lib/keys';
import { getActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { getContactPublicKeyModel, getKeyEncryptionCapableStatus } from '@proton/shared/lib/keys/publicKeys';
import extractEncryptionPreferences, {
    type EncryptionPreferences,
} from '@proton/shared/lib/mail/encryptionPreferences';
import { type Record, getPromiseValue } from '@proton/shared/lib/models/cache';

import { type MailSettingState, mailSettingsThunk } from '../mailSettings';

const DEFAULT_LIFETIME = 5 * MINUTE;

const cache = new Map<string, Record<EncryptionPreferences>>();

export const removeEmailsFromEncryptionPreferencesCache = (emails: string[]) => {
    emails.forEach((email) => {
        cache.delete(email);
    });
};

/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'.
 * NB: the current logic does not handle internal address keys belonging to external accounts, since these keys are not used by Inbox.
 */
export const getEncryptionPreferences = ({
    email,
    lifetime,
    contactEmailsMap,
    intendedForEmail = true,
}: GetEncryptionPreferencesArguments): ThunkAction<
    GetEncryptionPreferencesResult,
    KtState & MailSettingState & AddressKeysState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const api = extra.api;
        // In the context of email sending, we want to use v6/PQC keys if available, for security.
        // This is not always done for now (e.g. on calendar sharing) for performance reasons.
        const preferV6Keys = intendedForEmail;

        const [addresses, mailSettings] = await Promise.all([
            dispatch(addressesThunk()),
            dispatch(mailSettingsThunk()),
        ]);
        const canonicalEmail = canonicalizeInternalEmail(email);
        const selfAddress = getSelfSendAddresses(addresses).find(
            ({ Email }) => canonicalizeInternalEmail(Email) === canonicalEmail
        );
        let selfSend: SelfSend | undefined;
        let apiKeysConfig: ApiKeysConfig;
        let pinnedKeysConfig: PinnedKeysConfig;
        if (selfAddress) {
            // we do not trust the public keys in ownAddress (they will be deprecated in the API response soon anyway)
            const selfAddressKeys = await dispatch(addressKeysThunk({ addressID: selfAddress.ID }));
            const activeAddressKeys = await getActiveAddressKeys(selfAddress.SignedKeyList, selfAddressKeys);
            const primaryAddressKey = getPrimaryActiveAddressKeyForEncryption(activeAddressKeys, preferV6Keys);

            const selfPublicKey = primaryAddressKey.publicKey;
            const canEncrypt = await getKeyEncryptionCapableStatus(selfPublicKey);
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
            const { publicKeys: contactVerificationKeys } = splitKeys(await dispatch(userKeysThunk()));
            apiKeysConfig = await dispatch(
                getPublicKeysForInboxThunk({
                    email,
                    internalKeysOnly: intendedForEmail === false,
                    includeInternalKeysWithE2EEDisabledForMail: intendedForEmail === false,
                    lifetime,
                })
            );
            const isInternal = apiKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
            pinnedKeysConfig = await getPublicKeysVcardHelper(
                api,
                email,
                contactVerificationKeys,
                isInternal,
                contactEmailsMap
            );
        }
        const publicKeyModel = await getContactPublicKeyModel({
            emailAddress: email,
            apiKeysConfig,
            pinnedKeysConfig,
            preferV6Keys,
        });
        return extractEncryptionPreferences(publicKeyModel, mailSettings, selfSend);
    };
};

export const getEncryptionPreferencesThunk = ({
    email,
    intendedForEmail,
    lifetime = DEFAULT_LIFETIME,
    contactEmailsMap,
}: GetEncryptionPreferencesArguments): ThunkAction<
    GetEncryptionPreferencesResult,
    KtState & MailSettingState & AddressKeysState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const canonicalEmail = canonicalizeEmail(email);
        const miss = () =>
            dispatch(
                getEncryptionPreferences({
                    email: canonicalEmail,
                    intendedForEmail,
                    lifetime,
                    contactEmailsMap,
                })
            );
        return getPromiseValue(cache, canonicalEmail, miss, lifetime);
    };
};
