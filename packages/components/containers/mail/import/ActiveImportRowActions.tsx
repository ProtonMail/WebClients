import React from 'react';
import { c } from 'ttag';
import { resumeMailImport, cancelMailImport, updateMailImport } from 'proton-shared/lib/api/mailImport';

import { Alert, ConfirmModal, DropdownActions, Button } from '../../../components';
import { useApi, useLoading, useNotifications, useEventManager, useModals } from '../../../hooks';
import ImportMailModal from './modals/ImportMailModal';
import {
    OAuthProps,
    OAUTH_PROVIDER,
    Importer,
    ImportMailStatus,
    ImportMailError,
    AuthenticationMethod,
} from './interfaces';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import { getOAuthRedirectURL as getRedirectURL, getOAuthAuthorizationUrl } from './helpers';

interface Props {
    currentImport: Importer;
}

const ActiveImportRowActions = ({ currentImport }: Props) => {
    const { ID, Active, Email, ImapHost, ImapPort, Sasl } = currentImport;
    const { State, ErrorCode } = Active || {};
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const { triggerOAuthPopup } = useOAuthPopup({
        getRedirectURL,
        getAuthorizationUrl: () => getOAuthAuthorizationUrl(Email),
    });

    const handleReconnectOAuth = async () => {
        triggerOAuthPopup(OAUTH_PROVIDER.GMAIL, async (oauthProps: OAuthProps) => {
            await api(
                updateMailImport(ID, {
                    Code: oauthProps.code,
                    ImapHost,
                    ImapPort,
                    Sasl: AuthenticationMethod.OAUTH,
                    RedirectUri: oauthProps?.redirectURI,
                })
            );
            await api(resumeMailImport(ID));
            await call();
            /* @todo success notifications? */
        });
    };

    const handleResume = async (importID: string) => {
        await api(resumeMailImport(importID));
        await call();
        createNotification({ text: c('Success').t`Import resumed` });
    };

    const handleReconnect = async () => {
        await createModal(<ImportMailModal currentImport={currentImport} />);
    };

    const handleCancel = async (importID: string) => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    cancel={c('Action').t`Continue import`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Cancel import`}</Button>}
                >
                    <Alert type="error">
                        {c('Warning')
                            .t`If you cancel this import, you won't be able to resume it. Proton saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(cancelMailImport(importID));
        await call();
        createNotification({ text: c('Success').t`Import canceled` });
    };

    const list = [];

    if (State === ImportMailStatus.PAUSED) {
        const isAuthError = ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;

        list.push({
            text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
            onClick: () => {
                if (isAuthError) {
                    return withLoadingSecondaryAction(
                        Sasl === AuthenticationMethod.OAUTH ? handleReconnectOAuth() : handleReconnect()
                    );
                }

                return withLoadingSecondaryAction(handleResume(ID));
            },
            loading: loadingSecondaryAction,
        });
    }

    list.push({
        text: c('Action').t`Cancel`,
        onClick: () => withLoadingPrimaryAction(handleCancel(ID)),
        loading: loadingPrimaryAction,
        disabled: State === ImportMailStatus.CANCELED,
    });

    return <DropdownActions key="actions" size="small" list={list} />;
};

export default ActiveImportRowActions;
