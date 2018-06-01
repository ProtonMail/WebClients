import keyAlgorithm from '../../keys/helper/keyAlgorithm';

/* @ngInject */
function addressKeysViewModel(keyInfo, pmcw, authentication) {
    const getDecryptedKeys = (ID) => {
        if (ID === 'contact-keys') {
            return authentication.user.Keys.reduce((acc, { PrivateKey, decrypted }) => {
                if (decrypted) {
                    const [key] = pmcw.getKeys(PrivateKey);
                    acc.push(key);
                }
                return acc;
            }, []);
        }
        return authentication.getPrivateKeys(ID).filter(({ primaryKey }) => primaryKey.isDecrypted);
    };
    /**
     * From a group of addresses, massage the data in the way that the address keys view directive expects
     * with it's keys and main key as the first key.
     * @param {Object} addresses
     * @return {Array}
     */
    const getAddressKeys = (addresses = []) => {
        return addresses.reduce((acc, { Keys = [], ID = '', Email = '', Order, Status }) => {
            if (!Keys.length) {
                return acc;
            }

            const [{ fingerprint, created, bitSize, PrivateKey } = {}] = Keys;
            const [keyObject] = pmcw.getKeys(PrivateKey);

            if (!keyObject) {
                return acc;
            }

            const decryptedKeys = getDecryptedKeys(ID);
            const fingerprints = decryptedKeys.map((k) => k.primaryKey.getFingerprint());

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
        const Keys = await Promise.all(user.Keys.map(keyInfo));
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
