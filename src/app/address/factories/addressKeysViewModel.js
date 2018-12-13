import { getKeys, getFingerprint } from 'pmcrypto';

import { formatKey } from '../../../helpers/key';
import keyAlgorithm from '../../keys/helper/keyAlgorithm';
import { MAIN_KEY } from '../../constants';

/* @ngInject */
function addressKeysViewModel(keysModel) {
    /**
     * Get private keys for specific address
     * @param {String} ID
     * @return {Array<Key>}
     */
    const getDecryptedKeys = (ID) => {
        const addressID = ID === 'contact-keys' ? MAIN_KEY : ID;

        if (!keysModel.hasKey(ID)) {
            return [];
        }

        return keysModel.getPrivateKeys(addressID).filter((k) => k.isDecrypted());
    };

    /**
     * From a group of addresses, massage the data in the way that the address keys view directive expects
     * with it's keys and main key as the first key.
     * @param {Object} addresses
     * @return {Array}
     */
    const getAddressKeys = async (addresses = []) => {
        const addressesWithParsedKeys = await Promise.all(
            addresses.map(async (address) => {
                const { Keys = [] } = address;

                if (!Keys.length) {
                    return address;
                }

                const [{ PrivateKey } = {}] = Keys;

                return {
                    ...address,
                    keys: await getKeys(PrivateKey)
                };
            })
        );

        return addressesWithParsedKeys.reduce((acc, { Keys = [], keys = [], ID = '', Email = '', Order, Status }) => {
            if (!Keys.length) {
                return acc;
            }

            const [{ fingerprint, created, bitSize } = {}] = Keys;
            const [keyObject] = keys;

            if (!keyObject) {
                return acc;
            }

            const decryptedKeys = getDecryptedKeys(ID);
            const fingerprints = decryptedKeys.map(getFingerprint);

            const algType = keyAlgorithm.describe(Keys[0]);
            const address = {
                order: Order,
                addressID: ID,
                email: Email,
                status: Status,
                fingerprint,
                algType,
                created,
                bitSize,
                publicKey: keyObject.toPublic().armor(),
                keys: Keys.map((key) => ({
                    decrypted: fingerprints.some((fingerprint) => fingerprint === key.fingerprint),
                    algType: keyAlgorithm.describe(key),
                    ...key
                }))
            };

            acc.push(address);

            return acc;
        }, []);
    };

    /**
     * From a user, get the contact keys, group them by display name, and get them in the address keys format.
     * @param {User} user
     * @returns {Array}
     */
    const getUserKeys = async (user) => {
        const Keys = await Promise.all(user.Keys.map(formatKey));
        const contactAddress = {
            ID: 'contact-keys',
            Email: user.Name,
            Order: 1,
            Keys
        };

        return getAddressKeys([contactAddress]);
    };

    return { getUserKeys, getAddressKeys };
}

export default addressKeysViewModel;
