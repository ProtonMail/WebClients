import { KEY_FLAG } from 'proton-shared/lib/constants';
import { FlagAction } from './interface';

const { SIGNED, ENCRYPTED_AND_SIGNED, CLEAR_TEXT } = KEY_FLAG;

export const getNewKeyFlags = (action: FlagAction) => {
    if (action === FlagAction.MARK_OBSOLETE) {
        return SIGNED;
    }
    if (action === FlagAction.MARK_NOT_OBSOLETE) {
        return ENCRYPTED_AND_SIGNED;
    }
    if (action === FlagAction.MARK_COMPROMISED) {
        return CLEAR_TEXT;
    }
    if (action === FlagAction.MARK_NOT_COMPROMISED) {
        return SIGNED;
    }
    throw new Error('Unknown action');
};
