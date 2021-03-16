import React from 'react';
import locales from 'proton-shared/lib/i18n/locales';

import {
    PublicAuthenticationStore,
    PrivateAuthenticationStore,
    useAuthentication,
    DefaultThemeInjector,
} from 'react-components';

import PrivateApp from './content/PrivateApp';
import PublicApp from './content/PublicApp';

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp locales={locales} onLogout={logout} />;
    }
    return (
        <>
            <DefaultThemeInjector />
            <PublicApp locales={locales} onLogin={login} />
        </>
    );
};

export default Setup;
