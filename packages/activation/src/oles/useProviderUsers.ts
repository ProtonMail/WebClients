import { useEffect, useState } from 'react';

import { getOrganizationUsers } from '@proton/activation/src/api/api';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useApi } from '@proton/components/index';

import type { ApiImporterOrganizationUser } from '../api/api.interface';
import useProviderTokens from './useProviderTokens';

const useProviderUsers = (): [ApiImporterOrganizationUser[], boolean] => {
    const api = useApi();
    const [providerTokens, providerTokensLoading] = useProviderTokens(OAUTH_PROVIDER.GSUITE);
    const [usersState, setUsersState] = useState<{ users: ApiImporterOrganizationUser[]; loading: boolean }>({
        users: [],
        loading: true,
    });
    const loading = usersState.loading || providerTokensLoading;

    useEffect(() => {
        void (async () => {
            if (providerTokensLoading) {
                return;
            }

            const users: ApiImporterOrganizationUser[] = !providerTokens.length
                ? []
                : await api<{ Users: ApiImporterOrganizationUser[] }>(getOrganizationUsers())
                      .then((r) => r.Users)
                      .catch((_) => []);

            setUsersState({
                loading: false,
                users,
            });
        })();
    }, [providerTokens, providerTokensLoading]);

    return [usersState.users, loading];
};

export default useProviderUsers;
