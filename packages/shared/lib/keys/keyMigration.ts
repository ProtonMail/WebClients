import { Address } from '../interfaces';

export const getHasMigratedAddressKey = ({ Token, Signature }: { Token?: string; Signature?: string }): boolean => {
    return !!Token && !!Signature;
};

export const getHasMigratedAddressKeys = (addresses: Address[]) => {
    return addresses.some((address) => address.Keys?.some(getHasMigratedAddressKey));
};
