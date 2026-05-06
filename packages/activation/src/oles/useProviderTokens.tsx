import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import type { EASY_SWITCH_FEATURES, ImportToken, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useOAuthToken } from '@proton/activation/src/logic/oauthToken/hooks';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import isTruthy from '@proton/utils/isTruthy';

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
): [ImportToken[] | undefined, boolean] => {
    const api = useSilentApi();
    const [oauthTokens] = useOAuthToken();
    const { data, setData, loading, setLoading } = useContext(Context);

    useEffect(() => {
        if (!oauthTokens) {
            return;
        }

        void (async () => {
            setLoading(true);

            try {
                const refreshedTokens = (
                    await Promise.allSettled(
                        (oauthTokens as ImportToken[])
                            .filter((t) => t.Provider === provider && features.every((f) => t.Features.includes(f)))
                            .map(async (t) => {
                                return api<{ Tokens: ImportToken[] }>({
                                    ...getTokensByFeature({
                                        Account: t.Account,
                                        Features: features,
                                        Provider: provider,
                                    }),
                                    silent: true,
                                }).then(({ Tokens }) => Tokens.at(0));
                            })
                    )
                )
                    .map((result) => (result.status === 'fulfilled' ? result.value : undefined))
                    .filter(isTruthy);

                setData(refreshedTokens);
            } catch {
                setData(undefined);
            }

            setLoading(false);
        })();
    }, [oauthTokens]);

    return [data, loading];
};
