import { getFingerprint, signMessage, getKeys } from 'pmcrypto';

import { KEY_FLAG, MAIN_KEY } from '../../constants';
import { clearBit } from '../../../helpers/bitHelper';

const { ENCRYPTED, SIGNED, ENCRYPTED_AND_SIGNED } = KEY_FLAG;
const REMOVE_KEY = ['remove', 'set-primary', 'create'];
const UNSHIFT_KEY = ['reset', 'set-primary'];
const PUSH_KEY = ['create'];

/* @ngInject */
function keysModel(dispatchers) {
    const { dispatcher, on } = dispatchers(['keysModel']);
    let CACHE = {};
    const clear = () => (CACHE = {});
    const clearAddressKeys = () => {
        CACHE = {
            [MAIN_KEY]: CACHE[MAIN_KEY]
        };
    };

    /**
     * Store key and package in MAP[addressID][keyID]
     * @param {String} addressID
     * @param {Object} key metadata
     * @param {Object<Key>} pkg decrypted key
     */
    const storeKey = (addressID, key, pkg) => {
        CACHE[addressID] = CACHE[addressID] || {}; // Initialize Object for the package
        CACHE[addressID][key.ID] = { pkg, key }; // Add key model (coming from API) and the decrypted key package
    };

    /**
     * Store all keys and dispatch an event
     * Clear all keys before to store them
     * @param {Array<Object>} keys contains all keys (user + addresses)
     */
    const storeKeys = (keys = []) => {
        keys.forEach(({ address, key, pkg }) => storeKey(address.ID, key, pkg));
        dispatcher.keysModel('updated', { keys });
    };

    /**
     * Return the private keys available for a specific address ID
     * Only key that we can decrypt
     * @param {String} addressID
     * @return {Array<Key>} [pkg]
     */
    const getPrivateKeys = (addressID) => {
        return Object.keys(CACHE[addressID]).reduce((acc, keyID) => {
            const { pkg } = CACHE[addressID][keyID] || {};

            if (pkg) {
                acc.push(pkg);
            }

            return acc;
        }, []);
    };

    /**
     * Get all keys for a specific address
     * Even inactive keys
     * @param {String} addressID
     * @return {Array<Object>} [{ key, pkg }]
     */
    const getAllKeys = (addressID) => Object.keys(CACHE[addressID]).map((keyID) => CACHE[addressID][keyID]);

    /**
     * Return the activated public keys available for a specific address ID
     * @param {String} addressID
     * @return {Array}
     */
    const getPublicKeys = (addressID) => {
        return getPrivateKeys(addressID).map((pkg) => pkg.toPublic());
    };

    /**
     * Check if the key exist for a specific address
     * @param {String} addressID
     * @return {Boolean}
     */
    const hasKey = (addressID) => Object.keys(CACHE[addressID] || {}).length;

    /**
     * Helper to prepare Flags for a key
     * @param {String} mode reset, create, remove, set-primary, mark
     * @param {Object} key one of the private key object (current iteration)
     * @param {String} keyID key ID we are interacting with
     * @param {Integer} newFlags to apply
     */
    const getFlags = (mode, key, keyID, newFlags) => {
        if (mode === 'reset') {
            return clearBit(key.Flags, ENCRYPTED);
        }

        if (mode === 'mark' && key.ID === keyID) {
            return newFlags;
        }

        return key.Flags;
    };

    /**
     * Helper to get Fingerprint for a key
     * The reset case is the only case where the FE should use fingerprints supplied by the BE
     * We cannot trust the Fingerprint coming from the server so we have to get it from key
     * @param {String} mode
     * @param {Object} key
     * @return {Promise<String>} fingerprint
     */
    const extractFingerprint = async (mode, key, pkg) => {
        if (mode === 'reset') {
            return key.Fingerprint;
        }

        if (pkg) {
            return getFingerprint(pkg);
        }

        const [k] = await getKeys(key.PrivateKey);
        return k.getFingerprint();
    };

    /**
     * Helper to prepare Data for SignedKeyList
     * When we 'create' we remove the key first and push it after
     * When we 'remove' we remove the key from the list
     * When we 'set-primary' we remove the key first and unshift the key
     * When we 'reset' we unshift the key
     * @param {Array<Object>} privateKeys
     * @param {String} options.mode
     * @param {String} options.keyID
     * @param {Integer} options.newFlags
     * @param {Object<Key>} options.newPrivateKey
     * @param {Integer} options.canReceive
     * @return {Array<Object>} result.preparedKeys keys parsed for Data
     */
    const prepareKeys = async (privateKeys = [], { mode, keyID, newFlags, newPrivateKey, canReceive }) => {
        const keys = await Promise.all(
            privateKeys
                .filter(({ key }) => !(REMOVE_KEY.includes(mode) && key.ID === keyID))
                .map(async ({ key, pkg }) => {
                    return {
                        Fingerprint: await extractFingerprint(mode, key, pkg),
                        Flags: getFlags(mode, key, keyID, newFlags),
                        pkg
                    };
                })
        );

        if (UNSHIFT_KEY.includes(mode)) {
            keys.unshift({
                Fingerprint: getFingerprint(newPrivateKey),
                // If all keys are strictly signed then the new key should be just signed
                Flags: privateKeys.length && canReceive === 0 ? SIGNED : ENCRYPTED_AND_SIGNED,
                pkg: newPrivateKey
            });
        }

        if (PUSH_KEY.includes(mode)) {
            keys.push({
                Fingerprint: getFingerprint(newPrivateKey),
                Flags: ENCRYPTED_AND_SIGNED,
                pkg: newPrivateKey
            });
        }

        return {
            primaryKey: keys[0].pkg,
            preparedKeys: keys.map(({ Fingerprint, Flags }, index) => ({
                Fingerprint,
                Primary: +(index === 0), // set Primary for the first key
                Flags
            }))
        };
    };

    /**
     * For Key Transparency, we sign the list of address keys whenever we change it
     * @param {String} addressID address ID impacted
     * @param {String} options.mode reset, create, delete, set-primary, mark
     * @param {Object<Key>} options.privateKey new decrypted private key
     * @param {String} options.keyID key impacted
     * @param {Integer} options.newFlags flags we want to add when we mark
     * @param {Array} options.resetKeys used when the user reset his account
     * @param {Integer} options.canReceive
     * @return {Promise<Object>} SignedKeyList
     */
    const signedKeyList = async (
        addressID = MAIN_KEY,
        { mode, privateKey: newPrivateKey, keyID, newFlags, resetKeys = [], canReceive } = {}
    ) => {
        // In case we reset from outside, keys are not saved in keysModel
        const privateKeys = hasKey(addressID) ? getAllKeys(addressID) : resetKeys.map((key) => ({ key, pkg: null })); // Contains all keys, even inactive
        const { preparedKeys, primaryKey } = await prepareKeys(privateKeys, {
            mode,
            keyID,
            newFlags,
            newPrivateKey,
            canReceive
        });
        const Data = JSON.stringify(preparedKeys);
        const { signature: Signature } = await signMessage({
            data: Data,
            privateKeys: [primaryKey],
            armor: true,
            detached: true
        });

        return {
            Data,
            Signature
        };
    };

    on('logout', () => {
        clear();
    });

    return { storeKeys, getPublicKeys, getPrivateKeys, hasKey, signedKeyList, clearAddressKeys };
}
export default keysModel;
