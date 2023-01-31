import { c } from 'ttag';

import { getScopeFromProvider } from '@proton/activation/_legacy/EasySwitchOauthModal.helpers';
import { createToken, resumeImport, updateImport } from '@proton/activation/api';
import { ApiImporterError, ApiImporterState } from '@proton/activation/api/api.interface';
import useOAuthPopup from '@proton/activation/hooks/useOAuthPopup';
import {
    AuthenticationMethod,
    CheckedProductMap,
    EASY_SWITCH_SOURCE,
    ImportToken,
    ImportType,
    OAUTH_PROVIDER,
    OAuthProps,
} from '@proton/activation/interface';
import { reconnectImapImport } from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import { cancelImporter } from '@proton/activation/logic/importers/importers.actions';
import { ActiveImportID } from '@proton/activation/logic/importers/importers.interface';
import { selectActiveImporterById, selectImporterById } from '@proton/activation/logic/importers/importers.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import { Button } from '@proton/atoms';
import { Alert, AlertModal, DropdownActions, FeatureCode, useModalState } from '@proton/components';
import { useApi, useEventManager, useFeature, useLoading, useNotifications } from '@proton/components/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    activeImporterID: ActiveImportID;
}

const ImporterRowActions = ({ activeImporterID }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const activeImporter = useEasySwitchSelector((state) => selectActiveImporterById(state, activeImporterID));
    const importer = useEasySwitchSelector((state) => selectImporterById(state, activeImporter.importerID));
    const { ID, account, sasl, provider, products } = importer;
    const { product, errorCode, importState } = activeImporter;

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });
    const useNewScopeFeature = useFeature(FeatureCode.EasySwitchGmailNewScope);

    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const [cancelModalProps, showCancelModal, renderCancelModal] = useModalState();

    const handleReconnectOAuth = async (ImporterID: string) => {
        const useNewGmailScope = products?.includes(ImportType.MAIL) && useNewScopeFeature.feature?.Value === true;
        const checkedItems = (products || []).reduce((acc, item) => {
            acc[item] = true;
            return acc;
        }, {} as CheckedProductMap);

        // TODO: Typing should be more effective here
        const scopes = getScopeFromProvider(provider as unknown as OAUTH_PROVIDER, checkedItems, useNewGmailScope);

        triggerOAuthPopup({
            // TODO: Typing should be more effective here
            provider: provider as unknown as OAUTH_PROVIDER,
            loginHint: account,
            scope: scopes.join(' '),
            callback: async ({ Code, Provider, RedirectUri }: OAuthProps) => {
                const { Token }: { Token: ImportToken } = await api(
                    createToken({
                        Provider,
                        Code,
                        RedirectUri,
                        Source: EASY_SWITCH_SOURCE.RECONNECT_IMPORT,
                        Products: products || [product],
                    })
                );

                await api(updateImport(ID, { TokenID: Token.ID }));
                await api(
                    resumeImport({
                        ImporterID,
                        Products: [product],
                    })
                );
                await call();
                createNotification({ text: c('Success').t`Resuming import` });
            },
        });
    };

    const handleReconnect = async (importerID: string) => {
        await dispatch(reconnectImapImport(importerID));
        // const apiImporterResponse = await api<ApiImportResponse>(getImport(importerID));
        // const activeImport = getDeprecatedImporterFormatByID(apiImporterResponse);
        // await createModal(<ImportMailModal addresses={addresses} currentImport={activeImport} />);
    };

    const handleResume = async (ImporterID: string) => {
        await api(
            resumeImport({
                ImporterID,
                Products: [product],
            })
        );
        await call();
        createNotification({ text: c('Success').t`Resuming import` });
    };

    const isAuthError = errorCode === ApiImporterError.ERROR_CODE_IMAP_CONNECTION;

    const list = [
        ...(importState === ApiImporterState.PAUSED
            ? [
                  {
                      text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
                      onClick: () => {
                          if (isAuthError) {
                              return withLoadingSecondaryAction(
                                  !sasl || sasl === AuthenticationMethod.OAUTH
                                      ? handleReconnectOAuth(ID)
                                      : handleReconnect(ID)
                              );
                          }

                          return withLoadingSecondaryAction(handleResume(ID));
                      },
                      loading: loadingConfig || loadingSecondaryAction,
                      'data-testid': 'ReportsTable:reconnectImporter',
                  },
              ]
            : []),
        {
            text: c('Action').t`Cancel`,
            onClick: () => showCancelModal(true),
            loading: loadingPrimaryAction,
            disabled: importState === ApiImporterState.CANCELED,
        },
    ];

    return (
        <>
            <DropdownActions size="small" list={list} />

            {renderCancelModal && (
                <AlertModal
                    {...cancelModalProps}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                void withLoadingPrimaryAction(dispatch(cancelImporter({ activeImporterID })));
                                showCancelModal(false);
                            }}
                        >{c('Action').t`Cancel`}</Button>,
                        <Button
                            color="weak"
                            onClick={() => {
                                showCancelModal(false);
                            }}
                        >{c('Action').t`Continue`}</Button>,
                    ]}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning')
                            .t`If you cancel this import, you won't be able to resume it. ${BRAND_NAME} saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </AlertModal>
            )}
        </>
    );
};

export default ImporterRowActions;
