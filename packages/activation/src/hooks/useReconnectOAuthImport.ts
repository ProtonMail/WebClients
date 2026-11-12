import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useEventManager from '@proton/components/hooks/useEventManager';

import { createToken, getTokensByFeature, resumeImport, updateImport } from '../api/api';
import { getScopeFromProvider } from '../components/Modals/OAuth/OAuthModal.helpers';
import { getImportProviderFromApiProvider } from '../helpers/getImportProviderFromApiProvider';
import type { EASY_SWITCH_SOURCES, ImportToken, ImportType, OAuthProps } from '../interface';
import type { Importer } from '../logic/importers/importers.interface';
import useOAuthPopup from './useOAuthPopup';
import { getEasySwitchFeaturesFromProducts, getProviderNumber } from './useOAuthPopup.helpers';

/** Resumes an OAuth import paused by a connection error: reuses an existing token, or asks the user to grant access again. */
export const useReconnectOAuthImport = (source: EASY_SWITCH_SOURCES) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });

    const reconnectOAuthImport = async ({ ID, account, provider, products }: Importer, product: ImportType) => {
        const importProvider = getImportProviderFromApiProvider(provider);

        const resumeWithToken = async (token: ImportToken) => {
            await api(updateImport(ID, { TokenID: token.ID }));
            await api(
                resumeImport({
                    ImporterID: ID,
                    Features: getEasySwitchFeaturesFromProducts([product]),
                })
            );
            await call();
            createNotification({ text: c('Success').t`Resuming import` });
        };

        const scopes = getScopeFromProvider(importProvider, products);

        const features = getEasySwitchFeaturesFromProducts(products);

        const providerNumber = getProviderNumber(importProvider);

        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({ Account: account, Features: features, Provider: providerNumber })
        );

        if (Tokens.length > 0) {
            await resumeWithToken(Tokens[0]);
        } else {
            await triggerOAuthPopup({
                provider: importProvider,
                loginHint: account,
                features,
                scope: scopes.join(' '),
                callback: async ({ Code, Provider, RedirectUri }: OAuthProps) => {
                    const { Token }: { Token: ImportToken } = await api(
                        createToken({
                            Provider,
                            Code,
                            RedirectUri,
                            Source: source,
                            Features: getEasySwitchFeaturesFromProducts(products || [product]),
                        })
                    );

                    await resumeWithToken(Token);
                },
            });
        }
    };

    return { reconnectOAuthImport, loadingConfig };
};
