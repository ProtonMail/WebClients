/* @ngInject */
function formatKey(keyInfo, pmcw) {
    /**
     * Prepare a key by adding information and generating the corresponding public key to the key object.
     * @param {Object} key
     */
    const formatKey = async (source) => {
        const key = await keyInfo(source);
        const [k] = pmcw.getKeys(key.PrivateKey);

        return { ...key, PublicKey: k.toPublic().armor() };
    };

    return formatKey;
}

export default formatKey;
