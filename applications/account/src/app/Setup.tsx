import { PrivateAuthenticationStore, PublicAuthenticationStore, useAuthentication } from '@proton/components';
import { locales } from '@proton/shared/lib/i18n/locales';

import PrivateApp from './content/PrivateApp';
import PublicApp from './content/PublicApp';

const Setup = () => {
    const { UID, login, logout } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;
    if (UID) {
        return <PrivateApp locales={locales} onLogout={logout} />;
    }
    return <PublicApp locales={locales} onLogin={login} />;
};

export default Setup;
