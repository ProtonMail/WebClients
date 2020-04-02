import { useCallback } from 'react';
import { useAddresses, useApi, useGetAddressKeys, useMailSettings } from '../index';
import getPublicKeysVcardHelper from 'proton-shared/lib/api/helpers/getPublicKeysVcardHelper';
import getPublicKeysEmailHelper from 'proton-shared/lib/api/helpers/getPublicKeysEmailHelper';
import { getPublicKeyModel } from 'proton-shared/lib/keys/publicKeys';
import extractEncryptionPreferences from 'proton-shared/lib/mail/encryptionPreferences';

// Implement the logic in the document 'Encryption preferences for outgoing email'
/**
 * Given an email address and the user mail settings, return the encryption preferences for sending to that email.
 * The API entry point is also needed. The logic for how those preferences are determined is laid out in the
 * Confluence document 'Encryption preferences for outgoing email'
 */
const useGetEncryptionPreferences = () => {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();

    return useCallback(
        async (emailAddress: string) => {
            const selfAddress = addresses.find(({ Email }) => Email === emailAddress);
            let selfSend;
            let apiKeysConfig;
            let pinnedKeysConfig;
            if (selfAddress) {
                // we do not trust the public keys in ownAddress (they will be deprecated in the API response soon anyway)
                const selfPublicKey = (await getAddressKeys(selfAddress.ID))[0]?.publicKey;
                selfSend = { address: selfAddress, publicKey: selfPublicKey };
                // For own addresses, we use the decrypted keys in selfSend and do not fetch any data from the API
                apiKeysConfig = { Keys: [], publicKeys: [] };
                pinnedKeysConfig = { pinnedKeys: [] };
            } else {
                [apiKeysConfig, pinnedKeysConfig] = await Promise.all([
                    getPublicKeysEmailHelper(api, emailAddress),
                    getPublicKeysVcardHelper(api, emailAddress)
                ]);
            }
            const publicKeyModel = await getPublicKeyModel({
                emailAddress,
                apiKeysConfig,
                pinnedKeysConfig,
                mailSettings
            });
            return extractEncryptionPreferences(publicKeyModel, selfSend);
        },
        [api, getAddressKeys, mailSettings, addresses]
    );
};

export default useGetEncryptionPreferences;
