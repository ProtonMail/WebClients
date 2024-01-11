import { and, or } from '@proton/pass/utils/fp/predicates';
import { getIsAddressActive, getIsAddressEnabled, getIsAddressExternal } from '@proton/shared/lib/helpers/address';

/**
 * When user is external : make sure the address is enabled
 * When user is internal : make sure address is active
 */
export const getSupportedAddresses = or(getIsAddressActive, and(getIsAddressEnabled, getIsAddressExternal));
