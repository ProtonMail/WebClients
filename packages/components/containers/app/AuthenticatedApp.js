import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
    ApiContext,
    AuthenticationStoreContext,
    AskPasswordModal,
    ModelsProvider,
    NotificationsProvider,
    ModalsProvider
} from 'react-components';
import { srpAuth } from 'proton-shared/lib/srp';
import { getError } from 'proton-shared/lib/apiHandlers';
import withAuthHandlers from 'proton-shared/lib/api/helpers/withAuthHandlers';
import { queryUnlock } from 'proton-shared/lib/api/user';

import ThemeInjector from '../themes/ThemeInjector';

const AuthenticatedApp = ({ authenticationStore, onLogout, initApi, loginData, children }) => {
    const modalsRef = useRef();
    const notificationsRef = useRef();
    const apiRef = useRef();
    const authenticationRef = useRef({
        ...authenticationStore,
        logout: onLogout
    });

    const getApi = () => {
        if (apiRef.current) {
            return apiRef.current;
        }

        const handleError = (e) => {
            if (!notificationsRef.current) {
                throw e;
            }

            const { code, message, status } = getError(e);

            notificationsRef.current.createNotification({
                type: 'error',
                text: `${status} - ${code} - ${message}`
            });

            throw e;
        };

        const handleUnlock = async () => {
            if (!modalsRef.current) {
                throw new Error('could not create unlock modal');
            }

            const { password } = await new Promise((resolve, reject) => {
                modalsRef.current.createModal(
                    <AskPasswordModal onClose={reject} onSubmit={resolve} hideTwoFactor={true} />
                );
            });

            return srpAuth({
                api,
                credentials: { password },
                config: queryUnlock()
            });
        };

        const UID = authenticationStore.getUID();
        const call = initApi(UID);

        apiRef.current = withAuthHandlers({
            call,
            handleError,
            handleUnlock,
            handleLogout: onLogout
        });

        return apiRef.current;
    };

    const api = getApi();

    return (
        <NotificationsProvider ref={notificationsRef}>
            <ApiContext.Provider value={api}>
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
