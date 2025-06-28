import { KEY_FLAG } from '@proton/shared/lib/constants';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';

export enum FlagAction {
    MARK_OBSOLETE,
    MARK_NOT_OBSOLETE,
    MARK_COMPROMISED,
    MARK_NOT_COMPROMISED,
    DISABLE_ENCRYPTION,
    ENABLE_ENCRYPTION,
    DISABLE_EXPECT_SIGNED,
    ENABLE_EXPECT_SIGNED,
}

export const getNewAddressKeyFlags = (Flags = 0, action: FlagAction) => {
    if (action === FlagAction.MARK_OBSOLETE) {
        return clearBit(Flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
    }
    if (action === FlagAction.MARK_NOT_OBSOLETE) {
        return setBit(Flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
    }
    if (action === FlagAction.MARK_COMPROMISED) {
        return clearBit(Flags, KEY_FLAG.FLAG_NOT_COMPROMISED + KEY_FLAG.FLAG_NOT_OBSOLETE);
    }
    if (action === FlagAction.MARK_NOT_COMPROMISED) {
        return setBit(Flags, KEY_FLAG.FLAG_NOT_COMPROMISED);
    }
    if (action === FlagAction.ENABLE_ENCRYPTION) {
        return clearBit(Flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    }
    if (action === FlagAction.DISABLE_ENCRYPTION) {
        return setBit(Flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
    }
    if (action === FlagAction.ENABLE_EXPECT_SIGNED) {
        return clearBit(Flags, KEY_FLAG.FLAG_EMAIL_NO_SIGN);
    }
    if (action === FlagAction.DISABLE_EXPECT_SIGNED) {
        return setBit(Flags, KEY_FLAG.FLAG_EMAIL_NO_SIGN);
    }
    throw new Error('Unknown action');
};
