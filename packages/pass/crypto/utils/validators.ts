import { c } from 'ttag';

import { PassCryptoItemError } from './errors';

/* this is roughly equivalent to a 7kb binary blob */
export const MAX_ITEM_CONTENT_B64_LENGTH = 53248;

export const validateItemContentSize = (base64Content: string): string => {
    if (base64Content.length > MAX_ITEM_CONTENT_B64_LENGTH) {
        throw new PassCryptoItemError(c('Error').t`Item content cannot exceed 40kb`);
    }

    return base64Content;
};
