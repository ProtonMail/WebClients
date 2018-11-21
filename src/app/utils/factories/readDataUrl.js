/* @ngInject */
function readDataUrl(pmcw) {
    const error = 'The given url is not a data url.';
    return async (url) => {
        if (url.substring(0, 5) !== 'data:') {
            throw new Error(error);
        }

        const [, base64 = null] = url.split(',');
        if (!base64) {
            throw new Error(error);
        }

        return pmcw.binaryStringToArray(pmcw.decode_base64(base64));
    };
}
export default readDataUrl;
