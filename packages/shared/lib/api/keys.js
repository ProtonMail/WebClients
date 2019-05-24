export const getKeySalts = () => ({
    url: 'keys/salts',
    method: 'get'
});

/**
 * Create a key.
 * @param {String} AddressID
 * @param {String} PrivateKey
 * @param {Number} Primary
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const createAddressKeyRoute = ({ AddressID, Primary, PrivateKey, SignedKeyList }) => ({
    url: 'keys',
    method: 'post',
    data: {
        AddressID,
        PrivateKey,
        Primary,
        SignedKeyList
    }
});

/**
 * Reactivate a key.
 * @param {String} ID
 * @param {String} PrivateKey
 * @param {Object} [SignedKeyList] - If activating an address key
 * @return {Object}
 */
export const reactivateKeyRoute = ({ ID, PrivateKey, SignedKeyList }) => ({
    url: `keys/${ID}`,
    method: 'put',
    data: {
        PrivateKey,
        SignedKeyList
    }
});

/**
 * Set key as primary.
 * @param {String} ID
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const setKeyPrimaryRoute = ({ ID, SignedKeyList }) => ({
    url: `keys/${ID}/primary`,
    method: 'put',
    data: {
        SignedKeyList
    }
});

/**
 * Set key flags.
 * @param {String} ID
 * @param {Number} Flags
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const setKeyFlagsRoute = ({ ID, Flags, SignedKeyList }) => ({
    url: `keys/${ID}/flags`,
    method: 'put',
    data: {
        Flags,
        SignedKeyList
    }
});

/**
 * Set key flags.
 * @param {String} ID
 * @param {Object} SignedKeyList
 * @return {Object}
 */
export const removeKeyRoute = ({ ID, SignedKeyList }) => ({
    url: `keys/${ID}/delete`,
    method: 'put',
    data: {
        SignedKeyList
    }
});
