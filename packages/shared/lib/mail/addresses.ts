import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS, ADDRESS_TYPE } from '../constants';
import { addPlusAlias, canonicalizeInternalEmail } from '../helpers/email';
import type { Address } from '../interfaces';

/**
 * Get address from email
 * Remove + alias and transform to lower case
 */
export const getByEmail = (addresses: Address[], email = '') => {
    const value = canonicalizeInternalEmail(email);
    return addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === value);
};

/**
 * Detect if the email address is a valid plus alias and returns the address model appropriate
 */
export const getAddressFromPlusAlias = (addresses: Address[], email = ''): Address | undefined => {
    const plusIndex = email.indexOf('+');
    const atIndex = email.indexOf('@');

    if (plusIndex === -1 || atIndex === -1) {
        return;
    }

    // Remove the plus alias part to find a match with existing addresses
    const address = getByEmail(addresses, email);
    const { Status, Receive, Send } = address || {};

    if (!Status || !Receive || !Send) {
        // pm.me addresses on free accounts (Send = 0)
        return;
    }

    const plusPart = email.substring(plusIndex + 1, atIndex);

    // Returns an address where the Email is build to respect the existing capitalization and add the plus part
    return { ...(address as Address), Email: addPlusAlias(address?.Email, plusPart) };
};

export const getSupportedPlusAlias = ({
    selfAttendeeEmail,
    selfAddressEmail,
}: {
    selfAttendeeEmail: string;
    selfAddressEmail: string;
}) => {
    if (!selfAttendeeEmail) {
        return selfAddressEmail;
    }

    const plusIndex = selfAttendeeEmail.indexOf('+');
    const atIndex = selfAttendeeEmail.indexOf('@');
    const plusPart = selfAttendeeEmail.substring(plusIndex + 1, atIndex);

    if (plusIndex === -1) {
        return selfAddressEmail;
    }

    return addPlusAlias(selfAddressEmail, plusPart);
};

export const getIsNonDefault = (address: Address) => {
    return (
        address.Status === ADDRESS_STATUS.STATUS_DISABLED ||
        address.Type === ADDRESS_TYPE.TYPE_EXTERNAL ||
        address.Receive === ADDRESS_RECEIVE.RECEIVE_NO ||
        address.Send === ADDRESS_SEND.SEND_NO
    );
};

const addressSort = (a: Address, b: Address) => {
    if (getIsNonDefault(a)) {
        return 1;
    }
    if (getIsNonDefault(b)) {
        return -1;
    }
    return a.Order - b.Order;
};

export const sortAddresses = (addresses?: Address[]) => {
    if (Array.isArray(addresses)) {
        return [...addresses].sort(addressSort);
    }
    return [];
};

export const splitExternalAddresses = (addresses?: Address[]) => {
    if (!addresses) {
        return { otherAddresses: [], externalAddresses: [] };
    }

    return addresses.reduce<{ otherAddresses: Address[]; externalAddresses: Address[] }>(
        (acc, address) => {
            if (address?.Type === ADDRESS_TYPE.TYPE_EXTERNAL) {
                acc.externalAddresses.push(address);
            } else {
                acc.otherAddresses.push(address);
            }

            return acc;
        },
        { otherAddresses: [], externalAddresses: [] }
    );
};
