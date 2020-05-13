import { arrayToBinaryString } from 'pmcrypto';
import { deserializeUint8Array } from './serialization';

/**
 * Convert file to encoded base 64 string
 */
export const toBase64 = async (file: File, isValid: (file: File) => boolean = () => true) => {
    if (file && !isValid(file)) {
        throw new Error('Invalid file format');
    }
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            if (!target?.result) {
                return reject(new Error('Invalid file'));
            }
            resolve(target.result as string);
        };
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Read the content of a blob and returns its value as a buffer
 */
export const readFileAsBuffer = (file: File) => {
    return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            if (!target?.result) {
                return reject(new Error('Invalid file'));
            }
            resolve(target.result as ArrayBuffer);
        };
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Read the content of a blob and returns its value as a text string
 */
export const readFileAsString = (file: File, encoding?: string) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            if (!target?.result) {
                return reject(new Error('Invalid file'));
            }
            resolve(target.result as string);
        };
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsText(file, encoding);
    });
};

/**
 * Read the content of a blob and returns its value as a binary string.
 * Not using readAsBinaryString because it's deprecated.
 */
export const readFileAsBinaryString = async (file: File) => {
    const arrayBuffer = await readFileAsBuffer(file);
    // eslint-disable-next-line new-cap
    return arrayToBinaryString(new Uint8Array(arrayBuffer));
};

/**
 * Convert a blob url to the matching blob
 * @link https://stackoverflow.com/a/42508185
 */
export const blobURLtoBlob = (url: string) => {
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

    return deserializeUint8Array(base64);
};

/**
 * Split a filename into [name, extension]
 */
export const splitExtension = (filename = '') => {
    const endIdx = filename.lastIndexOf('.');
    if (endIdx === -1) {
        return [filename, ''];
    }
    return [filename.slice(0, endIdx), filename.slice(endIdx + 1)];
};
