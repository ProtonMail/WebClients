import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
    ApiContext,
    AuthenticationStoreContext,
    UnlockModal,
    ModelsProvider,
    NotificationsProvider,
    ModalsProvider
} from 'react-components';
import { revoke } from 'proton-shared/lib/api/auth';
import { getError } from 'proton-shared/lib/apiHandlers';
import withAuthHandlers, { CancelUnlockError } from 'proton-shared/lib/api/helpers/withAuthHandlers';

import ThemeInjector from '../themes/ThemeInjector';

const AuthenticatedApp = ({ authenticationStore, onLogout, initApi, loginData, children }) => {
    const modalsRef = useRef();
    const notificationsRef = useRef();
    const apiRef = useRef();
    const callRef = useRef();
    const authenticationRef = useRef();

    if (!apiRef.current) {
        const handleError = (e) => {
            if (!notificationsRef.current) {
                throw e;
            }

            if (e.name === 'InactiveSession') {
                // TODO: Can the session be revoked against the API here? Probably not since the session is inactive?
                onLogout();
                throw e;
            }

            if (e.name === 'CancelUnlock') {
                throw e;
            }

            const { message } = getError(e);

            if (message) {
                notificationsRef.current.createNotification({
                    type: 'error',
                    text: `${message}`
                });
            }

            throw e;
        };

        const handleUnlock = async () => {
            if (!modalsRef.current) {
                throw new Error('could not create unlock modal');
            }
            return new Promise((resolve, reject) => {
                modalsRef.current.createModal(
                    <UnlockModal onClose={() => reject(CancelUnlockError())} onSuccess={resolve} />
                );
            });
        };

        const UID = authenticationStore.getUID();

        callRef.current = initApi(UID);
        apiRef.current = withAuthHandlers({ call: callRef.current, handleError, handleUnlock });
    }

    if (!authenticationRef.current) {
        authenticationRef.current = {
            ...authenticationStore,
            logout: () => {
                callRef.current(revoke()).catch(() => {});
                onLogout();
            }
        };
    }

    return (
        <NotificationsProvider ref={notificationsRef}>
            <ApiContext.Provider value={apiRef.current}>
                <AuthenticationStoreContext.Provider value={authenticationRef.current}>
                    <ModelsProvider loginData={loginData}>
                        <ThemeInjector />
                        <ModalsProvider ref={modalsRef}>{children}</ModalsProvider>
                    </ModelsProvider>
                </AuthenticationStoreContext.Provider>
            </ApiContext.Provider>
        </NotificationsProvider>
    );
};

AuthenticatedApp.propTypes = {
    authenticationStore: PropTypes.object.isRequired,
    initApi: PropTypes.func.isRequired,
    loginData: PropTypes.object,
    onLogout: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default AuthenticatedApp;
