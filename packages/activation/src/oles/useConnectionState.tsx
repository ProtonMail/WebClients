import { type ReactNode, createContext, useContext, useState } from 'react';

import { useApi } from '@proton/components/index';

import { getConnectionStatus } from '../api';
import type { ApiImporterConnectionStatus } from '../api/api.interface';

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

export const useConnectionState = (): [ConnectionState | undefined, boolean, () => Promise<void>, () => void] => {
    const api = useApi();
    const { data, setData, loading, setLoading } = useContext(Context);

    const verify = async () => {
        setLoading(true);

        try {
            const { Status } = await api<{ Status: ApiImporterConnectionStatus }>(getConnectionStatus());
            setData(Status.IsConnected ? 'connected' : 'disconnected');
        } catch (err) {
            setData('disconnected');
        }

        setLoading(false);
    };

    const reset = () => {
        setLoading(false);
        setData(undefined);
    };

    return [data, loading, verify, reset];
};
