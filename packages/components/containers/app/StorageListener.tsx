import { useEffect } from 'react';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { PASSWORD_CHANGE_MESSAGE_TYPE, getIsSelf, getMessage } from '@proton/shared/lib/helpers/crossTab';

const StorageListener = () => {
    const authentication = useAuthentication();

    useEffect(() => {
        const cb = (e: StorageEvent) => {
            const message = getMessage(e);
            if (!message) {
                return;
            }
            const { id, type, data } = message;
            // If password changes happens on the same tab, a soft logout is performed to reset state everywhere.
            // Another possible idea is to reload it from storage, however since some keys may be cached, and race
            // conditions may happen with the event loop, this is a safer option.
            if (
                type === PASSWORD_CHANGE_MESSAGE_TYPE &&
                data?.localID === authentication.getLocalID?.() &&
                !getIsSelf(id)
            ) {
                replaceUrl(`${getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT)}`);
            }
        };
        window.addEventListener('storage', cb);
        return () => {
            window.removeEventListener('storage', cb);
        };
    }, []);

    return <>{null}</>;
};

export default StorageListener;
