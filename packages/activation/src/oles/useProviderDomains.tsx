import {
    type Dispatch,
    type MutableRefObject,
    type ReactNode,
    type SetStateAction,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import { c } from 'ttag';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getEmailParts } from '@proton/shared/lib/helpers/email';

import { getOrganizationDomains } from '../api/api';
import type { ApiImportProvider, ApiImporterOrganizationDomains } from '../api/api.interface';
import type { ImportToken } from '../interface';
import { sortMigrationDomainNames } from './domains';

type StateData = {
    loading: boolean;
    domainNames?: string[];
    error?: string;
};

const Context = createContext<{
    data: StateData;
    setData: Dispatch<SetStateAction<StateData>>;
    fetchedKeyRef: MutableRefObject<string | undefined>;
}>({
    data: { loading: false },
    setData: () => {},
    fetchedKeyRef: { current: undefined },
});

export const ProviderDomainsProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<StateData>({ loading: false });
    const fetchedKeyRef = useRef<string>();

    return <Context.Provider value={{ data, setData, fetchedKeyRef }}>{children}</Context.Provider>;
};

export const useProviderDomains = (
    provider: ApiImportProvider,
    tokens: ImportToken[] | undefined,
    enabled: boolean
): [string[] | undefined, boolean, string | undefined, () => Promise<void>] => {
    const api = useSilentApi();
    const { data, setData, fetchedKeyRef } = useContext(Context);
    const account = tokens?.[0]?.Account;
    const key = enabled && account ? `${provider}:${account}` : undefined;

    const refresh = useCallback(async () => {
        if (!key || !account) {
            setData({ loading: false });
            return;
        }

        setData((prev) => ({ ...prev, loading: true, error: undefined }));

        let next: StateData;
        try {
            const { DomainsNames } = await api<ApiImporterOrganizationDomains>(getOrganizationDomains(provider));
            next = { loading: false, domainNames: sortMigrationDomainNames(DomainsNames, getEmailParts(account)[1]) };
        } catch (error) {
            next = {
                loading: false,
                error: getApiError(error).message || c('Error').t`Failed to get the organization domains`,
            };
        }

        // The account can change while the request is in flight
        if (fetchedKeyRef.current !== key) {
            return;
        }

        setData(next);
    }, [key]);

    useEffect(() => {
        if (key && fetchedKeyRef.current === key) {
            return;
        }
        fetchedKeyRef.current = key;
        // Don't show the previous account's domains
        setData({ loading: false });
        void refresh();
    }, [key]);

    return [data.domainNames, data.loading, data.error, refresh];
};
