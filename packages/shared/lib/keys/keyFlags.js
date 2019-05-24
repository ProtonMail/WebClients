import { KEY_FLAG } from '../constants';

const { SIGNED, ENCRYPTED_AND_SIGNED } = KEY_FLAG;

export const getReactivateKeyFlagsAddress = ({ Receive }) => {
    return !Receive ? SIGNED : ENCRYPTED_AND_SIGNED;
};

export const getReactivateKeyFlagsUser = () => ENCRYPTED_AND_SIGNED;
