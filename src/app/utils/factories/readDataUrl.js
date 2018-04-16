/* @ngInject */
function readDataUrl(pmcw) {
    return (url) => {
        if (url.substring(0, 5) !== 'data:') {
            return Promise.reject('The given url is not a data url.');
        }

        return new Promise((resolve, reject) => {
            const [, base64 = null] = url.split(',');
            if (!base64) {
                reject('The given url is not a data url.');
            }
            resolve(pmcw.binaryStringToArray(pmcw.decode_base64(base64)));
        });
    };
}
export default readDataUrl;
