import { Address } from '@proton/shared/lib/interfaces';

import { ADDRESS_TYPE, KEY_FLAG } from '../constants';
import { clearBit, hasBit, setBit } from '../helpers/bitset';

export const setExternalFlags = (flags: number) => {
    flags = setBit(flags, KEY_FLAG.NO_EMAIL_ENCRYPT);
    flags = setBit(flags, KEY_FLAG.NO_EMAIL_SIGN);
    return flags;
};

export const clearExternalFlags = (flags: number) => {
    flags = clearBit(flags, KEY_FLAG.NO_EMAIL_ENCRYPT);
    flags = clearBit(flags, KEY_FLAG.NO_EMAIL_SIGN);
    return flags;
};

export const getDefaultKeyFlags = (address: Address | undefined) => {
    let flags = KEY_FLAG.FLAG_NOT_OBSOLETE + KEY_FLAG.FLAG_NOT_COMPROMISED;
    if (address?.Type === ADDRESS_TYPE.TYPE_EXTERNAL) {
        flags = setExternalFlags(flags);
    }
    return flags;
};

export const getKeyHasFlagsToVerify = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED);
};

export const getKeyHasFlagsToEncrypt = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
};
