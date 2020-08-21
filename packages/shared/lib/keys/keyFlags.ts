import { KEY_FLAG } from '../constants';
import { Address, CachedKey, Key } from '../interfaces';

export const getDefaultKeyFlagsAddress = ({ Receive }: Address, addressKeysList: Key[] | CachedKey[]) => {
    // If the address has keys, and the address can not receive, the new key can only be used to verify signatures
    return !Receive && addressKeysList.length > 0 ? KEY_FLAG.VERIFY : KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY;
};

export const getDefaultKeyFlagsUser = () => KEY_FLAG.ENCRYPT + KEY_FLAG.VERIFY;
