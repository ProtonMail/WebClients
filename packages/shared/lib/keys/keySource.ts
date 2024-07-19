import { API_KEY_SOURCE } from '../constants';
import type { ProcessedApiKey } from '../interfaces';

export const getInternalKeys = (keys: ProcessedApiKey[]) => {
    return keys.filter(({ source }) => source === API_KEY_SOURCE.PROTON);
};

export const getExternalKeys = (keys: ProcessedApiKey[]) => {
    return keys.filter(({ source }) => source !== API_KEY_SOURCE.PROTON);
};
