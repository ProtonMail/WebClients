import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Prompt, useEventManager, useModalState } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { createToken, getTokensByFeature, resumeImport, updateImport } from '../../../api';
import { ApiImporterError, ApiImporterState } from '../../../api/api.interface';
import { getImportProviderFromApiProvider } from '../../../helpers/getImportProviderFromApiProvider';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import { getEasySwitchFeaturesFromProducts, getProviderNumber } from '../../../hooks/useOAuthPopup.helpers';
import { useTrackImportAction } from '../../../hooks/useTrackImportAction';
import type { ImportToken, OAuthProps } from '../../../interface';
import { AuthenticationMethod, EASY_SWITCH_SOURCES } from '../../../interface';
import { reconnectImapImport } from '../../../logic/draft/imapDraft/imapDraft.actions';
import { cancelImporter } from '../../../logic/importers/importers.actions';
import type { ActiveImporter, Importer } from '../../../logic/importers/importers.interface';
import { useEasySwitchDispatch } from '../../../logic/store';
import { getScopeFromProvider } from '../../Modals/OAuth/OAuthModal.helpers';

interface Props {
    activeImporter: ActiveImporter;
    importer: Importer;
}

const ImporterRowActions = ({ activeImporter, importer }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const { ID, account, sasl, provider, products } = importer;
    const { product, errorCode, importState } = activeImporter;
    const importProvider = getImportProviderFromApiProvider(provider);

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });

    const api = useApi();
    const trackEvent = useTrackImportAction({ account, provider, product });
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const [cancelModalProps, showCancelModal, renderCancelModal] = useModalState();

    const handleResumeImport = async (token: ImportToken, importerID: string) => {
        await api(updateImport(ID, { TokenID: token.ID }));
        await api(
            resumeImport({
                ImporterID: importerID,
                Features: getEasySwitchFeaturesFromProducts([product]),
            })
        );
        await call();
        createNotification({ text: c('Success').t`Resuming import` });
    };

    const handleReconnectOAuth = async (ImporterID: string) => {
        const scopes = getScopeFromProvider(importProvider, products);

        const features = getEasySwitchFeaturesFromProducts(products);

        const providerNumber = getProviderNumber(importProvider);

        const { Tokens } = await api<{ Tokens: ImportToken[] }>(
            getTokensByFeature({ Account: account, Features: features, Provider: providerNumber })
        );

        if (Tokens.length > 0) {
            await handleResumeImport(Tokens[0], ImporterID);
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
                            Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_RECONNECT_IMPORT,
                            Features: getEasySwitchFeaturesFromProducts(products || [product]),
                        })
                    );

                    await handleResumeImport(Token, ImporterID);
                },
            });
        }
    };

    const handleReconnect = async (importerID: string) => {
        await dispatch(reconnectImapImport(importerID));
    };

    const handleResume = async (ImporterID: string) => {
        await api(
            resumeImport({
                ImporterID,
                Features: getEasySwitchFeaturesFromProducts([product]),
            })
        );
        await call();
        createNotification({ text: c('Success').t`Resuming import` });
    };

    const handleCancel = () => {
        const activeImporterID = activeImporter.localID;
        void withLoadingPrimaryAction(dispatch(cancelImporter({ activeImporterID })));
        void trackEvent('cancel_import');
        showCancelModal(false);
    };

    const isAuthError = errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION;

    const handleResumeOrReconnect = async () => {
        if (isAuthError) {
            const isOAuth = !sasl || sasl === AuthenticationMethod.OAUTH;
            void withLoadingSecondaryAction(isOAuth ? handleReconnectOAuth(ID) : handleReconnect(ID));
        } else {
            void withLoadingSecondaryAction(handleResume(ID));
        }
        void trackEvent('resume_import');
    };

    return (
        <div className="inline-flex gap-1">
            {importState === ApiImporterState.PAUSED && (
                <Button
                    onClick={handleResumeOrReconnect}
                    loading={loadingConfig || loadingSecondaryAction}
                    data-testid="ReportsTable:reconnectImporter"
                >
                    {isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`}
                </Button>
            )}

            <Button
                onClick={() => showCancelModal(true)}
                loading={loadingPrimaryAction}
                disabled={importState === ApiImporterState.CANCELED}
            >
                {c('Action').t`Cancel`}
            </Button>

            {renderCancelModal && (
                <Prompt
                    {...cancelModalProps}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    buttons={[
                        <Button color="danger" onClick={handleCancel}>{c('Action').t`Cancel`}</Button>,
                        <Button
                            color="weak"
                            onClick={() => {
                                showCancelModal(false);
                            }}
                        >{c('Action').t`Continue`}</Button>,
                    ]}
                >
                    {c('Warning')
                        .t`If you cancel this import, you won't be able to resume it. ${BRAND_NAME} saved all progress in your account. Cancel anyway?`}
                </Prompt>
            )}
        </div>
    );
};

export default ImporterRowActions;
