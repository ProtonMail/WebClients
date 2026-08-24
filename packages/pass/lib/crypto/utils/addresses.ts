import { getIsAddressActive, getIsAddressEnabled, getIsAddressExternal } from '@proton/shared/lib/helpers/address';

import { and, or } from '../../../utils/fp/predicates';

/**
 * When user is external : make sure the address is enabled
 * When user is internal : make sure address is active
 */
export const getSupportedAddresses = or(getIsAddressActive, and(getIsAddressEnabled, getIsAddressExternal));
