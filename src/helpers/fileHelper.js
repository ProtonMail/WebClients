/**
 * Convert file to encoded base 64 string
 * @param  {File} file
 * @return {Promise}
 */
export const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => resolve(target.result);
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
