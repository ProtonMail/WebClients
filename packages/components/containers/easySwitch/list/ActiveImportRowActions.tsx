import { c } from 'ttag';
import { cancelImport, createToken, resumeImport, updateImport } from '@proton/shared/lib/api/easySwitch';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import {
    NormalizedImporter,
    ImportStatus,
    ImportError,
    AuthenticationMethod,
    OAUTH_PROVIDER,
    ImportType,
    OAuthProps,
    ImportToken,
    EASY_SWITCH_SOURCE,
} from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, ConfirmModal, DropdownActions, Button } from '../../../components';
import {
    useApi,
    useLoading,
    useEventManager,
    useModals,
    useNotifications,
    useAddresses,
    useSystemConfig,
} from '../../../hooks';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import {
    G_OAUTH_SCOPE_CALENDAR,
    G_OAUTH_SCOPE_CONTACTS,
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL,
} from '../constants';

import ImportMailModal from '../mail/modals/ImportMailModal';

interface Props {
    activeImport: NormalizedImporter;
}

const ActiveImportRowActions = ({ activeImport }: Props) => {
    const { ID, Active, Product, Sasl } = activeImport;
    const { State, ErrorCode } = Active || {};

    const { triggerOAuthPopup } = useOAuthPopup();

    const api = useApi();
    const [addresses, loadingAddresses] = useAddresses();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const [config] = useSystemConfig();

    const handleReconnectOAuth = async (ImporterID: string) => {
        const scopes = [
            ...G_OAUTH_SCOPE_DEFAULT,
            Product === ImportType.MAIL && G_OAUTH_SCOPE_MAIL,
            Product === ImportType.CALENDAR && G_OAUTH_SCOPE_CALENDAR,
            Product === ImportType.CONTACTS && G_OAUTH_SCOPE_CONTACTS,
            // checkedTypes[DRIVE] && G_OAUTH_SCOPE_DRIVE,
        ]
            .filter(isTruthy)
            .flat(1);

        triggerOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            client_id: config['importer.google.client_id'],
            scope: scopes.join(' '),
            callback: async ({ Code, Provider, RedirectUri }: OAuthProps) => {
                const { Token }: { Token: ImportToken } = await api(
                    createToken({
                        Provider,
                        Code,
                        RedirectUri,
                        Source: EASY_SWITCH_SOURCE.RECONNECT_IMPORT,
                        Products: [Product],
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
                    cancel={c('Action').t`Continue import`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Cancel import`}</Button>}
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
                        Sasl === AuthenticationMethod.OAUTH ? handleReconnectOAuth(ID) : handleReconnect()
                    );
                }

                return withLoadingSecondaryAction(handleResume(ID));
            },
            loading: loadingSecondaryAction,
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
