import { ApiAddressKeySource, ProcessedApiAddressKey } from '../interfaces';

export const getInternalKeys = (keys: ProcessedApiAddressKey[]) => {
    return keys.filter(({ source }) => source === ApiAddressKeySource.PROTON);
};

export const getExternalKeys = (keys: ProcessedApiAddressKey[]) => {
    return keys.filter(({ source }) => source !== ApiAddressKeySource.PROTON);
};
