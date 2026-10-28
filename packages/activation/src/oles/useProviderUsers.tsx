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
    importerOrganizationId: string | undefined,
    domainName: string | undefined,
    provider: ApiImportProvider,
    useCachedData: boolean = false
): [ApiImporterOrganizationUser[] | undefined, boolean, () => Promise<void>, boolean] => {
    const api = useSilentApi();
    const { data, setData, loading, setLoading, fetchedKeyRef } = useContext(Context);

    const key = importerOrganizationId && domainName ? `${provider}:${domainName}` : undefined;

    const refresh = useCallback(async () => {
        setLoading(true);

        if (!key || !domainName) {
            setData({ Users: [] });
            setLoading(false);
            return;
        }

        // The key can change while the request is in flight
        const isCurrent = () => fetchedKeyRef.current === key;

        return api<ApiImporterOrganizationUsers>(
            getOrganizationUsers({ DomainName: domainName, Provider: provider }, useCachedData)
        )
            .then((r) => {
                if (isCurrent()) {
                    setData({ Users: r.Users, TooManyUsers: r.TooManyUsers });
                }
            })
            .catch(() => {
                if (isCurrent() && !data) {
                    setData({ Users: [] });
                }
            })
            .finally(() => {
                if (isCurrent()) {
                    setLoading(false);
                }
            });
    }, [key, useCachedData]);

    useEffect(() => {
        if (key && fetchedKeyRef.current === key) {
            return;
        }
        fetchedKeyRef.current = key;
        void refresh();
    }, [key]);

    // The effect starts fetching a new key only after this render
    const isLoading = loading || (key !== undefined && fetchedKeyRef.current !== key);

    return [data?.Users, isLoading, refresh, data?.TooManyUsers ?? false];
};
