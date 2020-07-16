import { generateAddressKey } from './keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, KEY_FLAG } from '../constants';
import { clearBit } from '../helpers/bitset';
import { getSignature } from './getSignedKeyList';
import { Address, EncryptionConfig, Key } from '../interfaces';

const { SIGNED, ENCRYPTED, ENCRYPTED_AND_SIGNED } = KEY_FLAG;

const getResetKeys = (Keys: Key[], { canReceive, fingerprint }: { canReceive: boolean; fingerprint: string }) => {
    const oldKeys = Keys.map(({ Fingerprint, Flags }) => {
        return {
            // Special case for reset where it trusts the fingerprint received from the server.
            Fingerprint,
            Primary: 0,
            Flags: clearBit(Flags, ENCRYPTED),
        };
    });

    const newPrimary = {
        Fingerprint: fingerprint,
        Primary: 1,
        Flags: Keys.length && !canReceive ? SIGNED : ENCRYPTED_AND_SIGNED,
    };

    return [newPrimary, ...oldKeys];
};

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
    const newAddressesKeys = await Promise.all(
        addresses.map(({ Email }) => {
            return generateAddressKey({ email: Email, passphrase, encryptionConfig });
        })
    );
    return Promise.all(
        addresses.map(async ({ ID: AddressID, Keys = [], Receive }, i) => {
            const { privateKey, privateKeyArmored } = newAddressesKeys[i];
            const data = JSON.stringify(
                getResetKeys(Keys, {
                    canReceive: !!Receive,
                    fingerprint: privateKey.getFingerprint(),
                })
            );
            return {
                AddressID,
                PrivateKey: privateKeyArmored,
                SignedKeyList: {
                    Data: data,
                    Signature: await getSignature(data, privateKey),
                },
            };
        })
    );
};
