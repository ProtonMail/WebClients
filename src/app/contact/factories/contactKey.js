/* @ngInject */
function contactKey(pmcw, contactDetailsModel) {
    const decodeDataUri = (uri) => {
        const base64 = uri.substring(0, 5).toLowerCase() === 'data:' ? uri.split(',')[1] : uri;
        return pmcw.binaryStringToArray(pmcw.decode_base64(base64));
    };

    /**
     * Encodes an Uint8array as base64
     * @param Uint8Array bytes
     * @return string base64 encoding of the given bytes
     */
    const encodeBytes = (bytes) => pmcw.encode_base64(pmcw.arrayToBinaryString(bytes));

    /**
     * Tries extract the openpgp keys from a vCard KEY property.
     * @param vCard.Property keyProperty
     * @returns {boolean|object} false in case of error otherwise an openpgp key
     */
    const parseKey = (keyProperty) => {
        const dataValue = contactDetailsModel.unescapeValue(keyProperty.valueOf().trim());

        try {
            // strip data url if needed.
            const bytes = decodeDataUri(dataValue);
            // normal base 64 encoding
            return pmcw.getKeys(bytes);
        } catch (e) {
            // swallow
        }

        try {
            // try armored key
            return pmcw.getKeys(dataValue);
        } catch (e) {
            // swallow
        }

        return false;
    };

    /**
     * Extracts the base64 value of KEY property. In case the KEY property is already a valid pgp key in base64
     * it's returned as normal. If the KEY property is an armored pgp key the armor is stripped and the base64 is returned
     * @param vCard.Property keyProperty
     * @returns {boolean|string} false in case the key property does not contain a pgp key, a base64 encoded pgp key otherwise
     */
    const getBase64Value = (keyProperty) => {
        const dataValue = contactDetailsModel.unescapeValue(keyProperty.valueOf().trim());

        try {
            // strip data url if needed.
            const bytes = decodeDataUri(dataValue);
            // normal base 64 encoding
            pmcw.getKeys(bytes);
            // the value is already in correct format
            return encodeBytes(bytes);
        } catch (e) {
            // swallow
        }

        try {
            // try armored key
            pmcw.getKeys(dataValue);
            // just output the raw base 64
            return encodeBytes(pmcw.stripArmor(dataValue));
        } catch (e) {
            // swallow
        }

        return false;
    };

    return { parseKey, getBase64Value };
}
export default contactKey;
