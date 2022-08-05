import { Address } from '@proton/shared/lib/interfaces';

import { ADDRESS_TYPE, KEY_FLAG } from '../constants';
import { hasBit } from '../helpers/bitset';

export const getDefaultKeyFlags = (address: Address | undefined) => {
    let flags = KEY_FLAG.FLAG_NOT_OBSOLETE + KEY_FLAG.FLAG_NOT_COMPROMISED;
    if (address?.Type === ADDRESS_TYPE.TYPE_EXTERNAL) {
        flags += KEY_FLAG.FLAG_EXTERNAL;
    }
    return flags;
};

export const getKeyHasFlagsToVerify = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED);
};

export const getKeyHasFlagsToEncrypt = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
};
