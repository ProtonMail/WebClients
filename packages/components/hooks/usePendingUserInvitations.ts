import { useCallback } from 'react';

import { PendingInvitation as PendingUserInvitation } from '@proton/shared/lib/interfaces';
import { UserInvitationModel } from '@proton/shared/lib/models';
import { fetchPendingUserInvitations } from '@proton/shared/lib/models/userInvitationModelApi';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const usePendingUserInvitations = (): [PendingUserInvitation[] | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();

    const miss = useCallback(() => fetchPendingUserInvitations(api), [api]);
    return useCachedModelResult(cache, UserInvitationModel.key, miss);
};

export default usePendingUserInvitations;
