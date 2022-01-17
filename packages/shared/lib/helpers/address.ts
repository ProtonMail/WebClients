import { ADDRESS_STATUS, ADDRESS_TYPE, RECEIVE_ADDRESS, SEND_ADDRESS } from '../constants';
import { Address, Recipient } from '../interfaces';
import { ContactEmail } from '../interfaces/contacts';
import { canonizeInternalEmail } from './email';
import { unary } from './function';

export const getIsAddressDisabled = (address: Address) => {
    return address.Status === ADDRESS_STATUS.STATUS_DISABLED;
};

export const getIsAddressActive = (address: Address) => {
    return (
        address.Status === ADDRESS_STATUS.STATUS_ENABLED &&
        address.Receive === RECEIVE_ADDRESS.RECEIVE_YES &&
        address.Send === SEND_ADDRESS.SEND_YES
    );
};

export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(unary(getIsAddressActive));
};

export const hasAddresses = (addresses: Address[] | undefined): boolean => {
    return Array.isArray(addresses) && addresses.length > 0;
};

export const getHasOnlyExternalAddresses = (addresses: Address[]) => {
    return addresses.length >= 1 && addresses.every(({ Type }) => Type === ADDRESS_TYPE.TYPE_EXTERNAL);
};

export const contactToRecipient = (contact: Partial<ContactEmail> = {}, groupPath?: string): Partial<Recipient> => ({
    Name: contact.Name,
    Address: contact.Email,
    ContactID: contact.ContactID,
    Group: groupPath,
});

export const findUserAddress = (userEmail?: string, addresses: Address[] = []) => {
    if (!userEmail) {
        return undefined;
    }
    const canonicalUserEmail = canonizeInternalEmail(userEmail);
    return addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonicalUserEmail);
};
