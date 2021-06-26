import { useCallback } from 'react';
import { APP_NAMES, APPS } from '@proton/shared/lib/constants';
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { useLocation } from 'react-router-dom';

import useAppLink from './useAppLink';
import { useConfig } from '../../hooks';

const useSettingsLink = () => {
    const goToApp = useAppLink();
    const location = useLocation();
    const { APP_NAME } = useConfig();

    return useCallback(
        (path: string, app?: APP_NAMES, newTab?: boolean) => {
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                return goToApp(path, APP_NAME, newTab);
            }

            const settingsApp = APP_NAME === APPS.PROTONACCOUNT ? getAppFromPathnameSafe(location.pathname) : undefined;
            const slug = getSlugFromApp(settingsApp || app || APP_NAME);

            return goToApp(`/${slug}${path}`, APPS.PROTONACCOUNT, newTab);
        },
        [location, goToApp]
    );
};

export default useSettingsLink;
