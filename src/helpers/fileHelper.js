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
 * Read the content of a blob and returns its value as a string
 * @param  {Blob} file
 * @return {Promise}
 */
export const readFile = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsBinaryString(file);
    });
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
