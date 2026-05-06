import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { getJoiningLink, getOrganizationImporter } from '@proton/activation/src/api';
import type { ApiImporterOrganization, ApiJoiningLinkData } from '@proton/activation/src/api/api.interface';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

import { parseJoiningLinkData } from './thunk';
import type { JoiningLink } from './types';

type StateData = (ApiImporterOrganization & { JoiningLink?: JoiningLink })[];

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: StateData;
    setData: (data?: StateData) => void;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
});

export const ImporterOrganizationsProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<StateData>();

    return <Context.Provider value={{ loading, setLoading, data, setData }}>{children}</Context.Provider>;
};

export const useImporterOrganizations = (): [StateData | undefined, boolean, () => Promise<void>] => {
    const api = useSilentApi();
    const dispatch = useDispatch();
    const { data, setData, loading, setLoading } = useContext(Context);

    const refresh = async () => {
        setLoading(true);

        try {
            const result = await api<{ ImporterOrganizations: ApiImporterOrganization[] }>(getOrganizationImporter());

            const resultWithJoiningLink = await Promise.all(
                result.ImporterOrganizations.map(async (io) => {
                    const JoiningLink = await api<{ JoiningLinkData: ApiJoiningLinkData | null }>(
                        getJoiningLink(io.ImporterOrganizationID)
                    )
                        .then(({ JoiningLinkData }) =>
                            JoiningLinkData ? dispatch(parseJoiningLinkData(JoiningLinkData)).unwrap() : undefined
                        )
                        .catch(() => undefined);

                    return {
                        ...io,
                        JoiningLink,
                    };
                })
            );

            setData(resultWithJoiningLink);
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
    }, []);

    return [data, loading, refresh];
};
