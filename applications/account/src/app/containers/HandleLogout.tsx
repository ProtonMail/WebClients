import { useEffect } from 'react';

import { parseLogoutURL } from '@proton/shared/lib/authentication/logout';
import { getActiveSessionByUserID } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import noop from '@proton/utils/noop';

const HandleLogout = () => {
    useEffect(() => {
        const params = parseLogoutURL(new URL(window.location.href));

        if (params.logout) {
            window.location.hash = '';

            if (params.clearDeviceRecoveryData) {
                params.sessions.forEach(({ id }) => {
                    removeDeviceRecovery(id);
                });
            }

            params.sessions.forEach(({ id, s }) => {
                const session = getActiveSessionByUserID(id, s);
                if (session) {
                    removePersistedSession(session.localID, session.UID).catch(noop);
                }
            });
        }
    }, []);

    return null;
};

export default HandleLogout;
