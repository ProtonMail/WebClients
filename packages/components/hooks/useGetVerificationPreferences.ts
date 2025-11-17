import { useCallback } from 'react';

import { getVerificationPreferencesThunk } from '@proton/account/publicKeys/verificationPreferences';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { GetVerificationPreferences } from '@proton/shared/lib/interfaces/hooks/GetVerificationPreferences';

/**
 * Given an email address and the user mail settings, return the verification preferences for verifying messages
 * from that email address.
 */
const useGetVerificationPreferences = () => {
    const dispatch = useDispatch();
    return useCallback<GetVerificationPreferences>(
        (args) => dispatch(getVerificationPreferencesThunk(args)),
        [dispatch]
    );
};

export default useGetVerificationPreferences;
