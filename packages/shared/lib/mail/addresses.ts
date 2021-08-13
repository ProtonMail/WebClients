import { Address } from '../interfaces';
import { addPlusAlias, canonizeInternalEmail } from '../helpers/email';

/**
 * Get address from email
 * Remove + alias and transform to lower case
 */
export const getByEmail = (addresses: Address[], email = '') => {
    const value = canonizeInternalEmail(email);
    return addresses.find(({ Email }) => canonizeInternalEmail(Email) === value);
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

export const getSupportedPlusAlias = ({ selfAttendeeEmail, selfAddressEmail }: { selfAttendeeEmail: string, selfAddressEmail: string }) => {
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
