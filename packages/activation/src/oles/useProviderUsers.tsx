import {
    type MutableRefObject,
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import noop from '@proton/utils/noop';

import { getOrganizationUsers } from '../api/api';
import type {
    ApiImportProvider,
    ApiImporterOrganizationUser,
    ApiImporterOrganizationUsers,
} from '../api/api.interface';

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: ApiImporterOrganizationUsers;
    setData: (data?: ApiImporterOrganizationUsers) => void;
    fetchedKeyRef: MutableRefObject<string | undefined>;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
    fetchedKeyRef: { current: undefined },
});

export const ProviderUsersProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApiImporterOrganizationUsers>();
    const fetchedKeyRef = useRef<string>();

    return (
        <Context.Provider value={{ loading, setLoading, data, setData, fetchedKeyRef }}>{children}</Context.Provider>
    );
};

export const useProviderUsers = (
    domainName: string | undefined,
    provider: ApiImportProvider,
    useCachedData: boolean = false
): [ApiImporterOrganizationUser[] | undefined, boolean, () => Promise<void>, boolean] => {
    const api = useSilentApi();
    const { data, setData, loading, setLoading, fetchedKeyRef } = useContext(Context);

    const refresh = useCallback(async () => {
        setLoading(true);

        if (!domainName) {
            setData({ Users: [] });
            setLoading(false);
            return;
        }

        return api<ApiImporterOrganizationUsers>(
            getOrganizationUsers({ DomainName: domainName, Provider: provider }, useCachedData)
        )
            .then((r) => setData({ Users: r.Users, TooManyUsers: r.TooManyUsers }))
            .catch(data ? noop : () => setData({ Users: [] }))
            .finally(() => setLoading(false));
    }, [domainName, provider, useCachedData]);

    useEffect(() => {
        const key = domainName ? `${provider}:${domainName}` : undefined;
        if (key && fetchedKeyRef.current === key) {
            return;
        }
        fetchedKeyRef.current = key;
        void refresh();
    }, [domainName, provider]);

    return [data?.Users, loading, refresh, data?.TooManyUsers ?? false];
};
