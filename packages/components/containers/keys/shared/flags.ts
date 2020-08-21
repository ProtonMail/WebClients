import { KEY_FLAG } from 'proton-shared/lib/constants';
import { clearBit, setBit } from 'proton-shared/lib/helpers/bitset';
import { FlagAction } from './interface';

export const getNewKeyFlags = (Flags = 0, action: FlagAction) => {
    if (action === FlagAction.MARK_OBSOLETE) {
        return clearBit(Flags, KEY_FLAG.ENCRYPT);
    }
    if (action === FlagAction.MARK_NOT_OBSOLETE) {
        return setBit(Flags, KEY_FLAG.ENCRYPT);
    }
    if (action === FlagAction.MARK_COMPROMISED) {
        return clearBit(Flags, KEY_FLAG.VERIFY + KEY_FLAG.ENCRYPT);
    }
    if (action === FlagAction.MARK_NOT_COMPROMISED) {
        return setBit(Flags, KEY_FLAG.VERIFY);
    }
    throw new Error('Unknown action');
};
