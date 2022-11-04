import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { createToken, getImport, resumeImport, updateImport } from '@proton/shared/lib/api/easySwitch';
import {
    AuthenticationMethod,
    CheckedProductMap,
    EASY_SWITCH_SOURCE,
    ImportToken,
    ImportType,
    OAUTH_PROVIDER,
    OAuthProps,
} from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, AlertModal, DropdownActions, useModalState } from '../../../components';
import {
    useAddresses,
    useApi,
    useEventManager,
    useFeature,
    useLoading,
    useModals,
    useNotifications,
} from '../../../hooks';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import { FeatureCode } from '../../features';
import { getScopeFromProvider } from '../EasySwitchOauthModal.helpers';
import { cancelImporter } from '../logic/importers/importers.actions';
import { ActiveImportID } from '../logic/importers/importers.interface';
import { selectActiveImporterById, selectImporterById } from '../logic/importers/importers.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../logic/store';
import { ApiImporterError, ApiImporterState } from '../logic/types/api.types';
import ImportMailModal from '../mail/modals/ImportMailModal';
import { getDeprecatedImporterFormatByID } from './ImporterRow.helpers';

interface Props {
    activeImporterID: ActiveImportID;
}

const ImporterRowActions = ({ activeImporterID }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const activeImporter = useEasySwitchSelector((state) => selectActiveImporterById(state, activeImporterID));
    const importer = useEasySwitchSelector((state) => selectImporterById(state, activeImporter.importerID));
    const { ID, account, sasl, provider, products } = importer;
    const { product, errorCode, importState } = activeImporter;

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup();
    const useNewScopeFeature = useFeature(FeatureCode.EasySwitchGmailNewScope);

    const api = useApi();
    const [addresses, loadingAddresses] = useAddresses();
    const { call } = useEventManager();
    const { createModal } = useModals();
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
        const apiImporterResponse = await api(getImport(importerID));
        const activeImport = getDeprecatedImporterFormatByID(apiImporterResponse);
        await createModal(<ImportMailModal addresses={addresses} currentImport={activeImport} />);
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

    // TODO: Move actions list to store
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
                      disabled: loadingAddresses,
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
                            .t`If you cancel this import, you won't be able to resume it. Proton saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </AlertModal>
            )}
        </>
    );
};

export default ImporterRowActions;
