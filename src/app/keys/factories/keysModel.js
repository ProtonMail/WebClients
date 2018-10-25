/* @ngInject */
function keysModel(dispatchers) {
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

    on('logout', () => {
        CACHE = {};
    });

    return { storeKey, storeKeys, getPublicKeys, getPrivateKeys, hasKey };
}
export default keysModel;
