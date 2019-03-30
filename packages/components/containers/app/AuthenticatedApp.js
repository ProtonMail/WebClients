import React from 'react';
import PropTypes from 'prop-types';
import { srpAuth } from 'proton-shared/lib/srp';
import {
    ApiContext,
    AuthenticationStoreContext,
    AskPasswordModal,
    ModelsProvider,
    NotificationsProvider,
    PromptsProvider
} from 'react-components';
import { getError } from 'proton-shared/lib/apiHandlers';
import createState from 'proton-shared/lib/state/state';
import createPromptsManager from 'proton-shared/lib/prompts/manager';
import createNotificationsManager from 'proton-shared/lib/notifications/manager';
import withAuthHandlers from 'proton-shared/lib/api/helpers/withAuthHandlers';

import { queryUnlock } from 'proton-shared/lib/api/user';

const AuthenticatedApp = ({ authenticationStore, onLogout, initApi, initModels, children }) => {
    const notificationsManager = createNotificationsManager(createState([]));
    const promptsManager = createPromptsManager(createState([]));

    const handleError = (e) => {
        const { code, message, status } = getError(e);
        notificationsManager.createNotification({
            type: 'error',
            text: `${status} - ${code} - ${message}`
        });
        throw e;
    };

    const handleUnlock = async () => {
        const password = await promptsManager.createPrompt((resolve, reject) => {
            return <AskPasswordModal onClose={reject} onSubmit={resolve} />;
        });
        return srpAuth({
            api,
            credentials: { password },
            config: queryUnlock()
        });
    };

    const UID = authenticationStore.getUID();
    const call = initApi(UID);
    const api = withAuthHandlers({
        call,
        handleError,
        handleUnlock,
        handleLogout: onLogout
    });

    const authenticationStoreWithLogout = {
        ...authenticationStore,
        logout: onLogout
    };

    return (
        <NotificationsProvider manager={notificationsManager}>
            <ApiContext.Provider value={api}>
                <AuthenticationStoreContext.Provider value={authenticationStoreWithLogout}>
                    <ModelsProvider init={initModels}>
                        <PromptsProvider manager={promptsManager}>{children}</PromptsProvider>
                    </ModelsProvider>
                </AuthenticationStoreContext.Provider>
            </ApiContext.Provider>
        </NotificationsProvider>
    );
};

AuthenticatedApp.propTypes = {
    authenticationStore: PropTypes.object.isRequired,
    initApi: PropTypes.func.isRequired,
    initModels: PropTypes.func.isRequired,
    onLogout: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default AuthenticatedApp;
