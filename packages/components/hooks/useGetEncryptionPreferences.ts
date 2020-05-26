import { RECIPIENT_TYPES } from 'proton-shared/lib/constants';
import { normalizeInternalEmail } from 'proton-shared/lib/helpers/string';
import { useCallback } from 'react';
import { useAddresses, useApi, useGetAddressKeys, useGetUserKeys, useMailSettings } from '../index';
import getPublicKeysVcardHelper from 'proton-shared/lib/api/helpers/getPublicKeysVcardHelper';
import getPublicKeysEmailHelper from 'proton-shared/lib/api/helpers/getPublicKeysEmailHelper';
import { getContactPublicKeyModel } from 'proton-shared/lib/keys/publicKeys';
import extractEncryptionPreferences from 'proton-shared/lib/mail/encryptionPreferences';
import { splitKeys } from 'proton-shared/lib/keys/keys';

// Implement the logic in the document 'Encryption preferences for outgoing email'
/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The API entry point is also needed. The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'
 */
const useGetEncryptionPreferences = () => {
    const api = useApi();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();

    return useCallback(
        async (emailAddress: string, silence = true) => {
            const selfAddress = addresses.find(
                ({ Email }) => normalizeInternalEmail(Email) === normalizeInternalEmail(emailAddress)
            );
            let selfSend;
            let apiKeysConfig;
            let pinnedKeysConfig;
            if (selfAddress) {
                // we do not trust the public keys in ownAddress (they will be deprecated in the API response soon anyway)
                const selfPublicKey = (await getAddressKeys(selfAddress.ID))[0]?.publicKey;
                selfSend = { address: selfAddress, publicKey: selfPublicKey };
                // For own addresses, we use the decrypted keys in selfSend and do not fetch any data from the API
                apiKeysConfig = { Keys: [], publicKeys: [], RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL };
                pinnedKeysConfig = { pinnedKeys: [], isContact: false };
            } else {
                const { publicKeys } = splitKeys(await getUserKeys());
                apiKeysConfig = await getPublicKeysEmailHelper(api, emailAddress, silence);
                const isInternal = apiKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
                pinnedKeysConfig = await getPublicKeysVcardHelper(api, emailAddress, publicKeys, isInternal);
            }
            const publicKeyModel = await getContactPublicKeyModel({
                emailAddress,
                apiKeysConfig,
                pinnedKeysConfig
            });
            return extractEncryptionPreferences(publicKeyModel, mailSettings, selfSend);
        },
        [api, getAddressKeys, mailSettings, addresses]
    );
};

export default useGetEncryptionPreferences;
