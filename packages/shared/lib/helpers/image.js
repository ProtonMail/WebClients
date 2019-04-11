/**
 * Convert base64 string to Image
 * @param  {String} base64str
 * @return {Object}
 */
export const toImage = (base64str) => {
    return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.src = base64str;
    });
};

/**
 * Resizes a picture to a maximum length/width (based on largest dimension)
 * @param {String} original Base64 representation of image to be resized.
 * @param {Number} maxSize Amount of pixels that largest dimention (whether width or length) should have.
 * @param {String} finalMimeType Mime type of the resulting resized image.
 * @param {Number} encoderOptions A Number between 0 and 1 indicating image quality if the requested type is image/jpeg or image/webp
 * @return {Promise} receives base64 string of resized image.
 */
export const resizeImage = (original, maxSize, finalMimeType = 'image/jpeg', encoderOptions = 1) => {
    return toImage(original).then((image) => {
        // Resize the image
        const canvas = document.createElement('canvas');
        let { width } = image;
        let { height } = image;

        if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
        } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);

        return canvas.toDataURL(finalMimeType, encoderOptions);
    });
};

/**
 * Extract the mime and base64 str from a base64 image.
 * @param {String} str
 * @returns {Promise} {mime, base64}
 */
const extractBase64Image = (str = '') => {
    const [mimeInfo = '', base64 = ''] = (str || '').split(',');
    const [, mime = ''] = mimeInfo.match(/:(.*?);/) || [];
    return { mime, base64 };
};

/**
 * Convert a base 64 str to an uint8 array.
 * @param base64str
 * @returns {Uint8Array}
 */
const toUint8Array = (base64str) => {
    const bstr = atob(base64str);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return u8arr;
};

/**
 * Convert a data URL to a Blob Object
 * @param {String} base64str
 * @param {String} filename
 * @return {Object}
 */
export const toFile = (base64str, filename = 'file') => {
    const { base64, mime } = extractBase64Image(base64str);
    return new File([toUint8Array(base64)], filename, { type: mime });
};

/**
 * Convert a data URL to a Blob Object
 * @param  {String} base64str
 * @return {Blob}
 */
export const toBlob = (base64str) => {
    const { base64, mime } = extractBase64Image(base64str);
    return new Blob([toUint8Array(base64)], { type: mime });
};

/**
 * Down size image to reach the max size limit
 * @param  {String} base64str
 * @param  {} maxSize in bytes
 * @param  {String} mimeType
 * @param  {Number} encoderOptions
 * @return {Promise}
 */
export const downSize = (base64str, maxSize, mimeType = 'image/jpeg', encoderOptions = 1) => {
    const process = (source, max) => {
        return resizeImage(source, max, mimeType, encoderOptions).then((resized) => {
            const { size } = toBlob(resized);

            if (size <= maxSize) {
                return resized;
            }

            return process(resized, Math.round(max * 0.9));
        });
    };

    return toImage(base64str).then(({ height, width }) => process(base64str, height > width ? height : width));
};

/**
 * Returns true if the URL is an inline embedded image.
 * @param {String} src
 * @returns {boolean}
 */
export const isInlineEmbedded = (src = '') => src.startsWith('data:');

/**
 * Returns true if the URL is an embedded image.
 * @param {String} src
 * @returns {boolean}
 */
export const isEmbedded = (src = '') => src.startsWith('cid:');
