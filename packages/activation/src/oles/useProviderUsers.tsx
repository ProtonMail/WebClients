import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getOrganizationUsers } from '@proton/activation/src/api/api';
import { useApi } from '@proton/components/index';
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
    importerOrganizationId: string
): [ApiImporterOrganizationUser[] | undefined, boolean, () => Promise<void>] => {
    const api = useApi();
    const { data, setData, loading, setLoading } = useContext(Context);

    const refresh = useCallback(async () => {
        setLoading(true);

        return api<{ Users: ApiImporterOrganizationUser[] }>(getOrganizationUsers(importerOrganizationId))
            .then((r) => setData(r.Users))
            .catch(noop)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (data) {
            return;
        }

        void refresh();
    }, []);

    return [data, loading, refresh];
};
