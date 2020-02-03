import { AddressWithStatus } from './interface';

export const updateAddress = (oldAddresses: AddressWithStatus[], ID: string, diff: Partial<AddressWithStatus>) => {
    return oldAddresses.map((oldAddress) => {
        if (oldAddress.ID === ID) {
            return { ...oldAddress, ...diff };
        }
        return oldAddress;
    });
};
