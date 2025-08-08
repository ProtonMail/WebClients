import noop from '@proton/utils/noop';
import uniqueBy from '@proton/utils/uniqueBy';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { replaceUrl } from '../helpers/browser';
import type { AuthenticationStore } from './createAuthenticationStore';
import { requestFork } from './fork/consume';
import type { ExtraSessionForkData } from './interface';
import type { SignoutActionOptions, SignoutSessions } from './logoutInterface';
import { getLocalAccountLogoutUrl, getLogoutURL, getStandaloneLogoutURL } from './logoutUrl';
import type { ActiveSessionLite } from './persistedSessionHelper';
import {
    getPersistedSessionByLocalIDAndUID,
    getPersistedSessionByLocalIDAndUserID,
    removePersistedSession,
} from './persistedSessionStorage';

export const getSelfLogoutOptions = ({ authentication }: { authentication: AuthenticationStore }): SignoutSessions => {
    const UID = authentication.UID;
    const localID = authentication.localID;
    const selfSession = getPersistedSessionByLocalIDAndUID(localID, UID);
    if (!selfSession) {
        return {
            sessions: [],
            users: [],
            type: 'self',
        };
    }
    return {
        sessions: [selfSession],
        users: [{ id: selfSession.UserID, accessType: selfSession.accessType }],
        type: 'self',
    };
};

export const getAllSessionsLogoutOptions = ({
    authentication,
    sessions,
}: {
    authentication: AuthenticationStore;
    sessions: ActiveSessionLite[];
}): SignoutSessions => {
    // Self should be included
    const self = getSelfLogoutOptions({ authentication });

    // Try to get the sessions that exist on this subdomain from the global sessions, and always include the logged in user
    const options = sessions.reduce<SignoutSessions>((acc, cur) => {
        const persistedSession = getPersistedSessionByLocalIDAndUserID(cur.remote.LocalID, cur.remote.UserID);
        if (persistedSession) {
            acc.sessions.push(persistedSession);
        }
        acc.users.push({ id: cur.remote.UserID, accessType: cur.persisted.accessType });
        return acc;
    }, self);

    return {
        sessions: uniqueBy(options.sessions, (x) => x.localID),
        users: uniqueBy(options.users, (x) => `${x.id}-${x.accessType}`),
        type: 'all',
    };
};

export const handleLogout = async ({
    appName,
    authentication,
    type,
    options,
    extra,
}: {
    appName: APP_NAMES;
    type: 'full' | 'local';
    authentication: AuthenticationStore;
    options: SignoutActionOptions;
    extra?: ExtraSessionForkData;
}) => {
    const UID = authentication.UID;
    const mode = authentication.mode;
    const localID = extra?.localID ?? authentication.localID;

    if (UID) {
        removeLastRefreshDate(UID);
    }

    await Promise.all(
        options.sessions.map(async (persistedSession) => {
            await removePersistedSession(persistedSession).catch(noop);
        })
    );

    authentication.logout();

    if (mode === 'standalone') {
        replaceUrl(getStandaloneLogoutURL({ options }));
        return;
    }

    // In full sso logouts, account will need to do more work to clear the parent session
    if (type === 'full') {
        replaceUrl(getLogoutURL({ appName, options }));
        return;
    }

    // If it's not a full logout on account, we just strip the local id from the path in order to get redirected back
    if (appName === APPS.PROTONACCOUNT && type === 'local') {
        replaceUrl(getLocalAccountLogoutUrl({ appName, localID }));
        return;
    }

    // Any other type of session that still exists on account but not on this app should request to be forked
    requestFork({ fromApp: appName, localID, reason: options.reason, extra });
};

export const handleInvalidSession = ({
    appName,
    authentication,
    extra,
}: {
    appName: APP_NAMES;
    authentication: AuthenticationStore;
    extra?: ExtraSessionForkData;
}) => {
    // A session that is invalid should just do a local deletion on its own subdomain, to check if the session still exists on account.
    handleLogout({
        appName,
        options: {
            ...getSelfLogoutOptions({ authentication }),
            reason: 'session-expired',
            clearDeviceRecovery: false,
        },
        authentication,
        type: 'local',
        extra,
    }).catch(noop);
};
