/* @ngInject */
function keyInfo(pmcw) {
    /**
     * Get information about a key
     * @param  {Object} key the key object
     * @return {Promise} new key object enhanced with additional parameters
     */
    return async (key = {}) => {
        const { created, bitSize, fingerprint, algorithmName } = await pmcw.keyInfo(key.PrivateKey);

        return {
            ...key,
            created,
            bitSize,
            fingerprint,
            algorithmName
        };
    };
}

export default keyInfo;
