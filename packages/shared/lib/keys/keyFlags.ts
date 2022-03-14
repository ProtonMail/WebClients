import { KEY_FLAG } from '../constants';
import { hasBit } from '../helpers/bitset';

export const getDefaultKeyFlags = () => KEY_FLAG.FLAG_NOT_OBSOLETE + KEY_FLAG.FLAG_NOT_COMPROMISED;

export const getKeyHasFlagsToVerify = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED);
};

export const getKeyHasFlagsToEncrypt = (flags: KEY_FLAG) => {
    return hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
};
