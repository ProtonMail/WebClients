import { and, or } from '@proton/pass/utils/fp';
import { getIsAddressActive, getIsAddressEnabled, getIsAddressExternal } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

type AddressPredicate = (address: Address) => boolean;

/**
 * When user is external : make sure the address is enabled
 * When user is internal : make sure address is active
 */
export const getSupportedAddresses = or<AddressPredicate[]>(
    getIsAddressActive,
    and(getIsAddressEnabled, getIsAddressExternal)
);
