import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getJoiningLink, getOrganizationImporter } from '@proton/activation/src/api';
import type { ApiImporterOrganization, ApiJoiningLinkData } from '@proton/activation/src/api/api.interface';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

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

    const refresh = useCallback(async () => {
        setLoading(true);

        return api<{ ImporterOrganizations: ApiImporterOrganization[] }>(getOrganizationImporter())
            .then((result) =>
                Promise.all(
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
                )
            )
            .then((resultWithJoiningLink) => setData(resultWithJoiningLink))
            .catch(data ? noop : () => setData([]))
            .finally(() => setLoading(false));
    }, [data]);

    useEffect(() => {
        void refresh();
    }, []);

    return [data, loading, refresh];
};
