import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../constants';
import { Address, EncryptionConfig } from '../interfaces';
import { generateAddressKey } from './keys';
import getSignedKeyList from './getSignedKeyList';
import { getDefaultKeyFlagsAddress } from './keyFlags';

/**
 * Generates a new key for each address, encrypted with the new passphrase.
 */
export const getResetAddressesKeys = async ({
    addresses = [],
    passphrase = '',
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
}: {
    addresses: Address[];
    passphrase: string;
    encryptionConfig?: EncryptionConfig;
}) => {
    return Promise.all(
        addresses.map(async (address) => {
            const { ID: AddressID, Keys = [], Email } = address;
            const { privateKey, privateKeyArmored } = await generateAddressKey({
                email: Email,
                passphrase,
                encryptionConfig,
            });

            const newPrimary = {
                privateKey,
                primary: 1,
                flags: getDefaultKeyFlagsAddress(address, Keys),
            };

            const signedKeyList = await getSignedKeyList([newPrimary], privateKey);
            return {
                AddressID,
                PrivateKey: privateKeyArmored,
                SignedKeyList: signedKeyList,
            };
        })
    );
};
