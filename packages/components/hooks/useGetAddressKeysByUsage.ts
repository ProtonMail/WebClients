import { useCallback } from 'react';

import {
    type GetAddressKeysByUsage,
    getAddressKeysByUsageThunk,
} from '@proton/account/addressKeys/getAddressKeysByUsage';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

export type UseGetAddressKeysByUsage = () => GetAddressKeysByUsage;

/**
 * Get address keys divided by usage, with optional v6/PQC key support.
 */
export const useGetAddressKeysByUsage: UseGetAddressKeysByUsage = () => {
    const dispatch = useDispatch();
    return useCallback(async (args) => dispatch(getAddressKeysByUsageThunk(args)), [dispatch]);
};
