import { c } from 'ttag';

import { createToken, resumeImport, updateImport } from '@proton/activation/src/api';
import { ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { getImportProviderFromApiProvider } from '@proton/activation/src/helpers/getImportProviderFromApiProvider';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { AuthenticationMethod, EASY_SWITCH_SOURCE, ImportToken, OAuthProps } from '@proton/activation/src/interface';
import { reconnectImapImport } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { cancelImporter } from '@proton/activation/src/logic/importers/importers.actions';
import { ActiveImportID } from '@proton/activation/src/logic/importers/importers.interface';
import {
    selectActiveImporterById,
    selectImporterById,
} from '@proton/activation/src/logic/importers/importers.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms';
import { Alert, DropdownActions, Prompt, useModalState } from '@proton/components';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { getScopeFromProvider } from '../../Modals/OAuth/StepProducts/useStepProducts.helpers';

interface Props {
    activeImporterID: ActiveImportID;
}

const ImporterRowActions = ({ activeImporterID }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const activeImporter = useEasySwitchSelector((state) => selectActiveImporterById(state, activeImporterID));
    const importer = useEasySwitchSelector((state) => selectImporterById(state, activeImporter.importerID));
    const { ID, account, sasl, provider, products } = importer;
    const importProvider = getImportProviderFromApiProvider(provider);
    const { product, errorCode, importState } = activeImporter;

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });

    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const [cancelModalProps, showCancelModal, renderCancelModal] = useModalState();

    const handleReconnectOAuth = async (ImporterID: string) => {
        const scopes = getScopeFromProvider(importProvider, products);

        triggerOAuthPopup({
            provider: importProvider,
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
                <Prompt
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
                    <Alert className="mb-4" type="error">
                        {c('Warning')
                            .t`If you cancel this import, you won't be able to resume it. ${BRAND_NAME} saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </Prompt>
            )}
        </>
    );
};

export default ImporterRowActions;
