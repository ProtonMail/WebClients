import { INCOMING_DEFAULTS_LOCATION } from '../constants';
import { IncomingDefault } from '../interfaces';

/**
 * Check if an email address is inside email in incomingDefaults
 */
const isAddressIncluded = (
    incomingDefaults: IncomingDefault[] = [],
    emailAddress: string,
    location?: INCOMING_DEFAULTS_LOCATION
): IncomingDefault | undefined =>
    incomingDefaults.find(({ Location, Email }: IncomingDefault) => {
        if ((location && Location !== location) || !emailAddress) {
            return false;
        }

        if (Email) {
            return Email === emailAddress;
        }

        return false;
    });

export const isBlockedIncomingDefaultAddress = (incomingDefaults: IncomingDefault[], emailAddress: string): boolean => {
    const foundItem = isAddressIncluded(incomingDefaults, emailAddress, INCOMING_DEFAULTS_LOCATION.BLOCKED);

    return !!foundItem;
};

export const getBlockedIncomingDefaultByAddress = (
    incomingDefaults: IncomingDefault[],
    emailAddress: string
): IncomingDefault | undefined => {
    const foundItem = isAddressIncluded(incomingDefaults, emailAddress, INCOMING_DEFAULTS_LOCATION.BLOCKED);

    return foundItem;
};
