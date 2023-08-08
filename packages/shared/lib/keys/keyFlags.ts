import { Address } from '@proton/shared/lib/interfaces';

import { ADDRESS_FLAGS, ADDRESS_TYPE, KEY_FLAG } from '../constants';
import { clearBit, hasBit, setBit } from '../helpers/bitset';

export const setExternalFlags = (flags: number) => {
    flags = setBit(flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    flags = setBit(flags, KEY_FLAG.FLAG_EMAIL_NO_SIGN);
    return flags;
};

export const clearExternalFlags = (flags: number) => {
    flags = clearBit(flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    flags = clearBit(flags, KEY_FLAG.FLAG_EMAIL_NO_SIGN);
    return flags;
};

export const getDefaultKeyFlags = (address: Address | undefined) => {
    let flags = KEY_FLAG.FLAG_NOT_OBSOLETE + KEY_FLAG.FLAG_NOT_COMPROMISED;
    if (address?.Type === ADDRESS_TYPE.TYPE_EXTERNAL) {
        flags = setExternalFlags(flags);
    }
    if (hasBit(address?.Flags, ADDRESS_FLAGS.FLAG_DISABLE_E2EE)) {
        flags = setBit(flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    }
    if (hasBit(address?.Flags, ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED)) {
        flags = setBit(flags, KEY_FLAG.FLAG_EMAIL_NO_SIGN);
    }
    return flags;
};

export const getKeyHasFlagsToVerify = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED);
};

export const getKeyHasFlagsToEncrypt = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
};
