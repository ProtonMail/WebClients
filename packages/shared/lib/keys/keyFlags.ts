import { KEY_FLAG } from '../constants';
import { Address, KeyAction } from '../interfaces';

const { SIGNED, ENCRYPTED_AND_SIGNED } = KEY_FLAG;

export const getKeyFlagsAddress = ({ Receive }: Address, addressKeysList: KeyAction[]) => {
    return !Receive && addressKeysList.length > 0 ? SIGNED : ENCRYPTED_AND_SIGNED;
};

export const getKeyFlagsUser = () => ENCRYPTED_AND_SIGNED;
