import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import noop from '@proton/utils/noop';

import { getConnectionStatus } from '../api';
import type { ApiImporterConnectionStatus } from '../api/api.interface';
import type { ImportToken } from '../interface';

export type ConnectionState = 'connected' | 'disconnected';

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: ConnectionState;
    setData: (data?: ConnectionState) => void;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
});

export const ConnectionStateProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ConnectionState>();

    return <Context.Provider value={{ loading, setLoading, data, setData }}>{children}</Context.Provider>;
};

export const useConnectionState = (
    tokens: ImportToken[] | undefined
): [ConnectionState | undefined, boolean, () => Promise<void>] => {
    const api = useSilentApi();
    const { data, setData, loading, setLoading } = useContext(Context);

    const refresh = useCallback(async () => {
        setLoading(true);

        if (!tokens) {
            setData(undefined);
            setLoading(false);
            return;
        } else if (!tokens.length) {
            setData('disconnected');
            setLoading(false);
            return;
        }

        return api<{ Status: ApiImporterConnectionStatus }>(getConnectionStatus())
            .then((r) => setData(r.Status.IsConnected ? 'connected' : 'disconnected'))
            .catch(data ? noop : () => setData('disconnected'))
            .finally(() => setLoading(false));
    }, [data, tokens]);

    useEffect(() => {
        void refresh();
    }, [tokens]);

    return [data, loading, refresh];
};
