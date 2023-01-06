import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Address, Key } from '@proton/shared/lib/interfaces';
import { getAddressFromPlusAlias, getByEmail } from '@proton/shared/lib/mail/addresses';

/**
 * Check if the address is fallback (Can't receive but has keys)
 */
export const isFallbackAddress = (address?: Address, keys: Key[] = []) =>
    !!address && !address.Receive && !!keys.length;

export const isDirtyAddress = ({ Keys, Status }: Address) => !Keys.length || Status === ADDRESS_STATUS.STATUS_DISABLED;

export const isOwnAddress = (address?: Address, keys: Key[] = []) => !!address && !isFallbackAddress(address, keys);

export const isSelfAddress = (email: string | undefined, addresses: Address[]) =>
    !!addresses.find(({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(email || ''));

/**
 * Get matching address for the email in the list dealing with potential plus aliases
 */
export const getAddressFromEmail = (addresses: Address[], email = '') => {
    const addressForPlusAlias = getAddressFromPlusAlias(addresses, email);

    if (addressForPlusAlias) {
        return addressForPlusAlias;
    }

    return getByEmail(addresses, email);
};

/**
 * Return list of addresses available in the FROM select
 * Reference: Angular/src/app/composer/factories/composerFromModel.js
 */
export const getFromAddresses = (addresses: Address[], originalAddress = '') => {
    const result = addresses
        .filter(({ Status, Receive, Send }) => Status === 1 && Receive === 1 && Send === 1)
        .sort((a1, a2) => (a1.Order || 0) - (a2.Order || 0));

    const plusAddress = getAddressFromPlusAlias(addresses, originalAddress);

    if (plusAddress) {
        // It's important to unshift the plus address to be found first with find()
        result.unshift(plusAddress);
    }

    return result;
};

/**
 * Get address to use as sender for a new draft
 */
export const getFromAddress = (addresses: Address[], originalTo = '', addressID: string | undefined) => {
    const fromAddresses = getFromAddresses(addresses, originalTo);
    return fromAddresses.find((address) => address.ID === addressID) || fromAddresses[0];
};
