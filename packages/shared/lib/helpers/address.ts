import { ADDRESS_STATUS, RECEIVE_ADDRESS, SEND_ADDRESS } from '../constants';
import { Address } from '../interfaces/Address';

export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(({ Status, Receive, Send }) => {
        return (
            Status === ADDRESS_STATUS.STATUS_ENABLED &&
            Receive === RECEIVE_ADDRESS.RECEIVE_YES &&
            Send === SEND_ADDRESS.SEND_YES
        );
    });
};
