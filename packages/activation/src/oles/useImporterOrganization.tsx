import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { getOrganizationImporter } from '@proton/activation/src/api';
import type { ApiImporterOrganization } from '@proton/activation/src/api/api.interface';
import { useApi } from '@proton/components';

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: ApiImporterOrganization;
    setData: (data?: ApiImporterOrganization) => void;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
});

export const ImporterOrganizationProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ApiImporterOrganization>();

    return <Context.Provider value={{ loading, setLoading, data, setData }}>{children}</Context.Provider>;
};

export const useImporterOrganization = (): [ApiImporterOrganization | undefined, boolean] => {
    const api = useApi();
    const { data, setData, loading, setLoading } = useContext(Context);

    useEffect(() => {
        if (loading || data) {
            return;
        }

        void (async () => {
            setLoading(true);

            try {
                const result = await api<{ ImporterOrganizations: ApiImporterOrganization[] }>({
                    ...getOrganizationImporter(),
                    silence: true,
                });

                setData(result.ImporterOrganizations[0]);
            } catch {
                setData(undefined);
            }

            setLoading(false);
        })();
    }, []);

    return [data, loading];
};
