import { useCallback } from 'react';

import { getPublicKeysForInboxThunk } from '@proton/account/publicKeys/publicKeysForInbox';
import { useDispatch } from '@proton/redux-shared-store';
import type { GetPublicKeysForInbox } from '@proton/shared/lib/interfaces/hooks/GetPublicKeysForInbox';

/**
 * Get public keys valid in the context of Inbox apps.
 * In particular, internal address keys from external accounts are not returned.
 */
export const useGetPublicKeysForInbox = () => {
    const dispatch = useDispatch();
    return useCallback<GetPublicKeysForInbox>(async (args) => dispatch(getPublicKeysForInboxThunk(args)), [dispatch]);
};

export default useGetPublicKeysForInbox;
