import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS } from '../constants';
import type { Address } from '../interfaces/Address';
import { AddressConfirmationState } from '../interfaces/Address';

export const getIsAddressEnabled = (address: Address) => {
    return address.Status === ADDRESS_STATUS.STATUS_ENABLED;
};

export const getIsAddressConfirmed = (address: Address) => {
    return address.ConfirmationState === AddressConfirmationState.CONFIRMATION_CONFIRMED;
};

export const getIsAddressDisabled = (address: Address) => {
    return address.Status === ADDRESS_STATUS.STATUS_DISABLED;
};

export const getIsAddressActive = (address: Address) => {
    return (
        address.Status === ADDRESS_STATUS.STATUS_ENABLED &&
        address.Receive === ADDRESS_RECEIVE.RECEIVE_YES &&
        address.Send === ADDRESS_SEND.SEND_YES
    );
};
