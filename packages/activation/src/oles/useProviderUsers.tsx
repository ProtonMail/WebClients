import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { getOrganizationUsers } from '@proton/activation/src/api/api';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useApi } from '@proton/components/index';

import type { ApiImporterOrganizationUser } from '../api/api.interface';
import { useProviderTokens } from './useProviderTokens';

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: ApiImporterOrganizationUser[] | undefined;
    setData: (data?: ApiImporterOrganizationUser[]) => void;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
});

export const ProviderUsersProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApiImporterOrganizationUser[]>();

    return <Context.Provider value={{ loading, setLoading, data, setData }}>{children}</Context.Provider>;
};

export const useProviderUsers = (
    importerOrganizationId: string
): [ApiImporterOrganizationUser[] | undefined, boolean, () => Promise<void>] => {
    const api = useApi();
    const [providerTokens, providerTokensLoading] = useProviderTokens(OAUTH_PROVIDER.GSUITE);
    const { data, setData, loading: dataLoading, setLoading } = useContext(Context);
    const loading = dataLoading || providerTokensLoading;

    const refresh = async () => {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            const users = !providerTokens?.length
                ? undefined
                : await api<{ Users: ApiImporterOrganizationUser[] }>(
                      getOrganizationUsers(importerOrganizationId)
                  ).then((r) => r.Users);
            setData(users);
        } catch {
            setData(undefined);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (data) {
            return;
        }

        void refresh();
    }, [providerTokens]);

    return [data, loading, refresh];
};
