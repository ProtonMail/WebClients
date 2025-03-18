import { useEffect } from 'react';

import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import useApi from '@proton/components/hooks/useApi';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { type PersistedSession, SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { parseLogoutURL } from '@proton/shared/lib/authentication/logoutUrl';
import { findPersistedSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    getPersistedSessions,
    removePersistedSession,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { Api } from '@proton/shared/lib/interfaces';
import { removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/storage';
import noop from '@proton/utils/noop';

const clearSession = ({
    session,
    api,
    revokeSession,
}: {
    session: PersistedSession;
    api: Api;
    revokeSession?: boolean;
}) => {
    if (revokeSession) {
        const uidApi = getUIDApi(session.UID, api);
        uidApi(revoke()).catch(noop);
    }
    removePersistedSession(session).catch(noop);
};

const clear = ({ api }: { api: Api }) => {
    const params = parseLogoutURL(new URL(window.location.href));

    if (!params.logout) {
        return;
    }

    window.location.hash = '';

    if (params.clearDeviceRecoveryData) {
        params.sessions.forEach(({ id }) => {
            removeDeviceRecovery(id);
        });
    }

    // Sessions are revoked through the API in the case the user is signing out of all sessions (which is new
    // functionality introduced in the in-app account switcher.
    // Otherwise, it is guaranteed that the session has already been revoked in the private app itself.
    // It would be possible to do all the time, but it would trigger unnecessary 401's.
    const revokeSession = params.type === 'all';

    const silentApi = getSilentApi(api);
    const persistedSessions = getPersistedSessions();
    params.sessions.forEach(({ id, isSelf }) => {
        const session = findPersistedSession({
            persistedSessions,
            UserID: id,
            isSelf,
            // Ignore oauth sessions, they are only used in BEX.
            // This is to avoid signing out the oauth session if the same user has signed out with srp.
            source: [SessionSource.Proton, SessionSource.Saml],
        });
        if (session) {
            clearSession({ session, api: silentApi, revokeSession });
        }
    });
};

const HandleLogout = () => {
    const api = useApi();

    useEffect(() => {
        registerSessionListener({ type: 'all' });
        clear({ api });
    }, []);

    return null;
};

export default HandleLogout;
