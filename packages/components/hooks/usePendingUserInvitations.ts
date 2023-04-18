import { useCallback } from 'react';

import { getInvitations } from '@proton/shared/lib/api/user';
import { Api, PendingInvitation as PendingUserInvitation } from '@proton/shared/lib/interfaces';
import { UserInvitationModel } from '@proton/shared/lib/models';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

export const fetchPendingUserInvitations = (api: Api) =>
    api<{ UserInvitations: PendingUserInvitation[] }>(getInvitations()).then(({ UserInvitations }) => {
        return UserInvitations;
    });

const usePendingUserInvitations = (): [PendingUserInvitation[] | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();

    const miss = useCallback(() => fetchPendingUserInvitations(api), [api]);
    return useCachedModelResult(cache, UserInvitationModel.key, miss);
};

export default usePendingUserInvitations;
