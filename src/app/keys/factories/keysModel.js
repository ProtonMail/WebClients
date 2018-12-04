import { KEY_MODE, MAIN_KEY } from '../../constants';
import { removeFlag } from '../../../helpers/message';

const { ENCRYPTED, ENCRYPTED_AND_SIGNED } = KEY_MODE;

/* @ngInject */
function keysModel(dispatchers, pmcw) {
    const { dispatcher, on } = dispatchers(['keysModel']);
    let CACHE = {};

    const storeKey = (addressID, keyID, pkg) => {
        pkg.ID = keyID; // Add the keyID inside the package
        CACHE[addressID] = CACHE[addressID] || {}; // Initialize Object for the package
        CACHE[addressID][keyID] = pkg; // Add key package
    };

    const storeKeys = (keys = []) => {
        keys.forEach(({ address, key, pkg }) => storeKey(address.ID, key.ID, pkg));
        dispatcher.keysModel('updated', { keys });
    };

    /**
     * Return the private keys available for a specific address ID
     * @param {String} addressID
     * @return {Array}
     */
    const getPrivateKeys = (addressID) => {
        return Object.keys(CACHE[addressID]).map((keyID) => CACHE[addressID][keyID]);
    };

    /**
     * Return the activated public keys available for a specific address ID
     * @param {String} addressID
     * @return {Array}
     */
    const getPublicKeys = (addressID) => {
        return getPrivateKeys(addressID).map((key) => key.toPublic());
    };

    /**
     * Check if the key exist for a specific address
     * @param {String} addressID
     * @return {Boolean}
     */
    const hasKey = (addressID) => {
        return Object.keys(CACHE[addressID] || {}).length;
    };

    /**
     * Helper to prepare Flags for a key
     * @param {String} mode reset, create, delete, set-primary, mark
     * @param {Object} key one of the private key object (current iteration)
     * @param {String} keyID key ID we are interacting with
     * @param {Integer} newFlags to apply
     */
    const getFlags = (mode, key, keyID, newFlags) => {
        if (mode === 'reset') {
            return removeFlag(key.Flags, ENCRYPTED);
        }

        if (mode === 'mark' && key.ID === keyID) {
            return newFlags;
        }

        return key.Flags;
    };

    /**
     * Helper to prepare Data for SignedKeyList
     * When we 'create' we remove the key first and push it after
     * When we 'delete' we remove the key from the list
     * When we 'set-primary' we remove the key first and unshift the key
     * When we 'reset' we unshift the key
     * @param {Array} privateKeys
     * @param {String} options.mode
     * @param {String} options.keyID
     * @param {Integer} options.newFlags
     * @param {Object<Key>} options.privateKeyObject
     * @return {Array<Object>} keys
     */
    const getKeys = (privateKeys = [], { mode, keyID, newFlags, privateKeyObject }) => {
        const keys = privateKeys.reduce((acc, key) => {
            if (['delete', 'set-primary', 'create'].includes(mode) && key.ID === keyID) {
                return acc;
            }

            acc.push({
                Fingerprint: pmcw.getFingerprint(pmcw.getKeys(key.PrivateKey)[0]),
                Flags: getFlags(mode, key, keyID, newFlags)
            });

            return acc;
        }, []);

        if (mode === 'reset' || mode === 'set-primary') {
            keys.unshift({
                Fingerprint: pmcw.getFingerprint(privateKeyObject),
                Flags: ENCRYPTED_AND_SIGNED
            });
        }

        if (mode === 'create') {
            keys.push({
                Fingerprint: pmcw.getFingerprint(privateKeyObject),
                Flags: ENCRYPTED_AND_SIGNED
            });
        }

        // set Primary for the first key
        return keys.map((key, index) => ({
            ...key,
            Primary: +(index === 0)
        }));
    };

    /**
     * For Key Transparency, we sign the list of address keys whenever we change it
     * @param {String} addressID
     * @param {String} options.mode reset, create, delete, set-primary, mark
     * @param {String} options.privateKey If the request changes which key is primary, it's signed by the new one
     * @param {String} options.keyID
     * @param {Integer} options.newFlags flags we want to add
     * @return {Object} SignedKeyList
     */
    const signedKeyList = async (addressID = MAIN_KEY, { mode, privateKey, keyID, newFlags } = {}) => {
        const privateKeys = getPrivateKeys(addressID);
        const [privateKeyObject] = privateKey ? pmcw.getKeys(privateKey) : privateKeys; // Only the primary key signs
        const Data = JSON.stringify(getKeys(privateKeys, { mode, keyID, newFlags, privateKeyObject }));
        const { signature: Signature } = await pmcw.signMessage({
            data: Data,
            privateKeys: [privateKeyObject],
            armor: true,
            detached: true
        });

        return {
            Data,
            Signature
        };
    };

    on('logout', () => {
        CACHE = {};
    });

    return { storeKey, storeKeys, getPublicKeys, getPrivateKeys, hasKey, signedKeyList };
}
export default keysModel;
