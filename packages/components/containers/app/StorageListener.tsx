import React, { useEffect } from 'react';
import { getIsSelf, getMessage, PASSWORD_CHANGE_MESSAGE_TYPE } from 'proton-shared/lib/helpers/crossTab';

import { useAuthentication } from '../../hooks';

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
                authentication.logout('soft');
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
