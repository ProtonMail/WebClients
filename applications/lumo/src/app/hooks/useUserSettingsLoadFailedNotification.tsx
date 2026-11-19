import { useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';

import { useLumoSelector } from '../redux/hooks';

/**
 * Tells the user when their settings couldn't be loaded from the server at startup, so blank or
 * outdated settings aren't mistaken for lost data.
 */
export const useUserSettingsLoadFailedNotification = () => {
    const { createNotification } = useNotifications();
    const loadFailed = useLumoSelector((state) => state.initialization.remoteUserSettingsLoadFailed);

    useEffect(() => {
        if (!loadFailed) {
            return;
        }
        createNotification({
            type: 'error',
            // translator: Error toast shown when the user's settings (personalization, memories, preferences) failed to load.
            text: c('collider_2025: Error')
                .t`Your settings couldn't be loaded, so what you see may be out of date. Reload the page to try again.`,
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadFailed]);
};
