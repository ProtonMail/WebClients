import { c } from 'ttag';

import { cancelImport, createToken, resumeImport, updateImport } from '@proton/shared/lib/api/easySwitch';
import {
    AuthenticationMethod,
    EASY_SWITCH_SOURCE,
    ImportError,
    ImportStatus,
    ImportToken,
    ImportType,
    NormalizedImporter,
    OAUTH_PROVIDER,
    OAuthProps,
} from '@proton/shared/lib/interfaces/EasySwitch';
import isTruthy from '@proton/utils/isTruthy';

import { Alert, Button, ConfirmModal, DropdownActions } from '../../../components';
import {
    useAddresses,
    useApi,
    useApiEnvironmentConfig,
    useEventManager,
    useFeature,
    useLoading,
    useModals,
    useNotifications,
} from '../../../hooks';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import { FeatureCode } from '../../features';
import {
    G_OAUTH_SCOPE_CALENDAR,
    G_OAUTH_SCOPE_CONTACTS,
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL,
    G_OAUTH_SCOPE_MAIL_NEW_SCOPE,
} from '../constants';
import ImportMailModal from '../mail/modals/ImportMailModal';

interface Props {
    activeImport: NormalizedImporter;
}

const ActiveImportRowActions = ({ activeImport }: Props) => {
    const { ID, Active, Product, Account, Sasl, tokenScope } = activeImport;
    const { State, ErrorCode } = Active || {};

    const { triggerOAuthPopup } = useOAuthPopup();
    const useNewScopeFeature = useFeature(FeatureCode.EasySwitchGmailNewScope);

    const api = useApi();
    const [addresses, loadingAddresses] = useAddresses();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const [config, loadingConfig] = useApiEnvironmentConfig();

    const handleReconnectOAuth = async (ImporterID: string) => {
        const scopes = [
            ...G_OAUTH_SCOPE_DEFAULT,
            tokenScope?.includes(ImportType.MAIL) &&
                (useNewScopeFeature.feature?.Value === true ? G_OAUTH_SCOPE_MAIL_NEW_SCOPE : G_OAUTH_SCOPE_MAIL),
            tokenScope?.includes(ImportType.CALENDAR) && G_OAUTH_SCOPE_CALENDAR,
            tokenScope?.includes(ImportType.CONTACTS) && G_OAUTH_SCOPE_CONTACTS,
            // tokenScope?.includes(ImportType.DRIVE) && G_OAUTH_SCOPE_DRIVE,
        ]
            .filter(isTruthy)
            .flat(1);

        triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            clientID: config['importer.google.client_id'],
            loginHint: Account,
            scope: scopes.join(' '),
            callback: async ({ Code, Provider, RedirectUri }: OAuthProps) => {
                const { Token }: { Token: ImportToken } = await api(
                    createToken({
                        Provider,
                        Code,
                        RedirectUri,
                        Source: EASY_SWITCH_SOURCE.RECONNECT_IMPORT,
                        Products: tokenScope || [Product],
                    })
                );

                await api(updateImport(ID, { TokenID: Token.ID }));
                await api(
                    resumeImport({
                        ImporterID,
                        Products: [Product],
                    })
                );
                await call();
                createNotification({ text: c('Success').t`Resuming import` });
            },
        });
    };

    const handleReconnect = async () => {
        await createModal(<ImportMailModal addresses={addresses} currentImport={activeImport} />);
    };

    const handleResume = async (ImporterID: string) => {
        await api(
            resumeImport({
                ImporterID,
                Products: [Product],
            })
        );
        await call();
        createNotification({ text: c('Success').t`Resuming import` });
    };

    const handleCancel = async (ImporterID: string) => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    cancel={c('Action').t`Continue`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Cancel`}</Button>}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning')
                            .t`If you cancel this import, you won't be able to resume it. Proton saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(
            cancelImport({
                ImporterID,
                Products: [Product],
            })
        );
        await call();
        createNotification({ text: c('Success').t`Canceling import` });
    };

    const list = [];

    if (State === ImportStatus.PAUSED) {
        const isAuthError = ErrorCode === ImportError.ERROR_CODE_IMAP_CONNECTION;

        list.push({
            text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
            onClick: () => {
                if (isAuthError) {
                    return withLoadingSecondaryAction(
                        !Sasl || Sasl === AuthenticationMethod.OAUTH ? handleReconnectOAuth(ID) : handleReconnect()
                    );
                }

                return withLoadingSecondaryAction(handleResume(ID));
            },
            loading: loadingConfig || loadingSecondaryAction,
            disabled: loadingAddresses,
        });
    }

    list.push({
        text: c('Action').t`Cancel`,
        onClick: () => withLoadingPrimaryAction(handleCancel(ID)),
        loading: loadingPrimaryAction,
        disabled: State === ImportStatus.CANCELED,
    });

    return <DropdownActions size="small" list={list} />;
};

export default ActiveImportRowActions;
