import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getOrganizationUsers } from '@proton/activation/src/api/api';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import noop from '@proton/utils/noop';

import type { ApiImporterOrganizationUser } from '../api/api.interface';

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
    domainName: string | undefined,
    useCachedData: boolean = false
): [ApiImporterOrganizationUser[] | undefined, boolean, () => Promise<void>] => {
    const api = useSilentApi();
    const { data, setData, loading, setLoading } = useContext(Context);

    const refresh = useCallback(async () => {
        setLoading(true);

        if (!domainName) {
            setData([]);
            setLoading(false);
            return;
        }

        return api<{ Users: ApiImporterOrganizationUser[] }>(
            getOrganizationUsers({ DomainName: domainName }, useCachedData)
        )
            .then((r) => setData(r.Users))
            .catch(data ? noop : () => setData([]))
            .finally(() => setLoading(false));
    }, [domainName, useCachedData]);

    useEffect(() => {
        void refresh();
    }, [domainName]);

    return [data, loading, refresh];
};
