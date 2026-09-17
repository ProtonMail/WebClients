import { type ReactNode, type MutableRefObject, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import noop from '@proton/utils/noop';

import { getOrganizationUsers } from '../api/api';
import type { ApiImporterOrganizationUser, ApiImporterOrganizationUsers } from '../api/api.interface';

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: ApiImporterOrganizationUsers;
    setData: (data?: ApiImporterOrganizationUsers) => void;
    domainRef: MutableRefObject<string | undefined>;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
    domainRef: { current: undefined },
});

export const ProviderUsersProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApiImporterOrganizationUsers>();
    const domainRef = useRef<string>();

    return (
        <Context.Provider value={{ loading, setLoading, data, setData, domainRef }}>{children}</Context.Provider>
    );
};

export const useProviderUsers = (
    domainName: string | undefined,
    useCachedData: boolean = false
): [ApiImporterOrganizationUser[] | undefined, boolean, () => Promise<void>, boolean] => {
    const api = useSilentApi();
    const { data, setData, loading, setLoading, domainRef } = useContext(Context);

    const refresh = useCallback(async () => {
        setLoading(true);

        if (!domainName) {
            setData({ Users: [] });
            setLoading(false);
            return;
        }

        return api<ApiImporterOrganizationUsers>(getOrganizationUsers({ DomainName: domainName }, useCachedData))
            .then((r) => setData({ Users: r.Users, TooManyUsers: r.TooManyUsers }))
            .catch(data ? noop : () => setData({ Users: [] }))
            .finally(() => setLoading(false));
    }, [domainName, useCachedData]);

    useEffect(() => {
        if (domainName && domainRef.current === domainName) {
            return;
        }
        domainRef.current = domainName;
        void refresh();
    }, [domainName]);

    return [data?.Users, loading, refresh, data?.TooManyUsers ?? false];
};
