import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { EASY_SWITCH_FEATURES, ImportToken, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useOAuthToken } from '@proton/activation/src/logic/oauthToken/hooks';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import noop from '@proton/utils/noop';

import { getTokensByFeature } from '../api';

type StateData = ImportToken[] | undefined;

const Context = createContext<{
    loading: boolean;
    setLoading: (loading: boolean) => void;
    data?: StateData;
    setData: (data: StateData) => void;
}>({
    loading: false,
    setLoading: () => {},
    data: undefined,
    setData: () => {},
});

export const ProviderTokensProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<StateData>();

    return <Context.Provider value={{ loading, setLoading, data, setData }}>{children}</Context.Provider>;
};

export const useProviderTokens = (
    provider: OAUTH_PROVIDER,
    features: EASY_SWITCH_FEATURES[] = []
): [ImportToken[] | undefined, boolean, () => Promise<void>] => {
    const api = useSilentApi();
    const [oauthTokens] = useOAuthToken();
    const { data, setData, loading, setLoading } = useContext(Context);

    const isProviderToken = (t: ImportToken) =>
        t.Provider === provider && features.every((f) => t.Features.includes(f));

    const refresh = useCallback(async () => {
        setLoading(true);

        if (!oauthTokens && !data) {
            setData(undefined);
            setLoading(false);
            return;
        }

        const filteredTokens = ((oauthTokens || []) as ImportToken[]).filter(isProviderToken);

        let refreshedToken: ImportToken | undefined;
        for (const token of filteredTokens) {
            refreshedToken = await api<{ Tokens: ImportToken[] }>(
                getTokensByFeature({ Account: token.Account, Features: features, Provider: provider })
            )
                .then(({ Tokens }) => Tokens.at(0))
                .catch(noop);

            if (refreshedToken) {
                break;
            }
        }

        setData(refreshedToken ? [refreshedToken] : []);
        setLoading(false);
    }, [data, oauthTokens]);

    useEffect(() => {
        void refresh();
    }, [oauthTokens]);

    return [data, loading, refresh];
};
