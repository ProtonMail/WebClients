import { BigNumber } from 'asmcrypto.js/dist_es8/bignum/bignum';

/**
 * From Uint8Array to big number
 * @param {Uint8Array} arr
 * @return {BigNumber}
 */
export const toBN = (arr) => {
    const reversed = new Uint8Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        reversed[arr.length - i - 1] = arr[i];
    }
    return BigNumber.fromArrayBuffer(reversed);
};

/**
 * From big number to Uint8Array
 * @param {Number} len
 * @param {BigNumber} bn
 * @return {Uint8Array}
 */
export const fromBN = (len, bn) => {
    const arr = bn.toBytes();
    const reversed = new Uint8Array(len / 8);
    for (let i = 0; i < arr.length; i++) {
        reversed[arr.length - i - 1] = arr[i];
    }
    return reversed;
};
