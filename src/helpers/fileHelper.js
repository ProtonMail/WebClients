/**
 * Convert file to encoded base 64 string
 * @param  {File} file
 * @return {Promise}
 */
export const toBase64 = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = ({ target }) => {
            resolve(target.result);
        };

        reader.readAsDataURL(file);
    });
};
