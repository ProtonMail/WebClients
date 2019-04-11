import { arrayToBinaryString, binaryStringToArray, decodeBase64 } from 'pmcrypto';

/**
 * Convert file to encoded base 64 string
 * @param  {File} file
 * @param {Function} isValid File validator ex: valid file type
 * @return {Promise}
 */
export const toBase64 = async (file, isValid = () => true) => {
    if (file && !isValid(file)) {
        throw new Error('Invalid file format');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = ({ target }) => {
            resolve(target.result);
        };
        reader.onerror = reject;
        reader.onabort = reject;

        reader.readAsDataURL(file);
    });
};

/**
 * Read the content of a blob and returns its value as a buffer
 * @param  {Blob} file
 * @return {Promise}
 */
export const readFileAsBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Read the content of a blob and returns its value as a string.
 * Not using readAsBinaryString because it's deprecated.
 * @param  {Blob} file
 * @return {Promise}
 */
export const readFileAsString = async (file) => {
    const arrayBuffer = await readFileAsBuffer(file);
    // eslint-disable-next-line new-cap
    return arrayToBinaryString(new Uint8Array(arrayBuffer));
};

/**
 * Convert a blob url to the matching blob
 * @link https://stackoverflow.com/a/42508185
 * @param  {String} url blob://xxxx
 * @return {Promise}     Blob
 */
export const blobURLtoBlob = (url) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.onerror = reject;
        xhr.onload = () => {
            if (xhr.status === 200) {
                return resolve(xhr.response);
            }
            reject(xhr);
        };
        xhr.send();
    });
};

/**
 * Read the base64 portion of a data url.
 * @param {String} url
 * @returns {Uint8Array}
 */
export const readDataUrl = (url = '') => {
    const error = 'The given url is not a data url.';

    if (url.substring(0, 5) !== 'data:') {
        throw new Error(error);
    }

    const [, base64] = url.split(',');
    if (!base64) {
        throw new Error(error);
    }

    return binaryStringToArray(decodeBase64(base64));
};
