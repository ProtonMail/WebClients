import { arrayToHexString, binaryStringToArray, SHA256 } from 'pmcrypto';

export const getSHA256String = async (data: string) => {
    const value = await SHA256(binaryStringToArray(data));
    return arrayToHexString(value);
};
