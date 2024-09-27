import { useEffect } from 'react';

import { useConfig, useDrawer, useOnline, useUser } from '@proton/components/hooks';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import {
    addParentAppToUrl,
    getDisplayDrawerApp,
    getIsDrawerApp,
    getIsIframedDrawerApp,
    getLocalStorageUserDrawerKey,
} from '@proton/shared/lib/drawer/helpers';
import type { DrawerLocalStorageValue } from '@proton/shared/lib/drawer/interfaces';
import { getItem } from '@proton/shared/lib/helpers/storage';

const useOpenDrawerOnLoad = () => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const { offline } = useApiStatus();
    const onlineStatus = useOnline();
    const authentication = useAuthentication();
    const { setIframeSrcMap, setIframeURLMap, setAppInView } = useDrawer();

    const isAppReachable = !offline && onlineStatus;

    useEffect(() => {
        const itemFromStorage = getItem(getLocalStorageUserDrawerKey(user.ID));
        if (itemFromStorage) {
            // Surround JSON.parse by try/catch in case the value cannot be parsed
            try {
                const { app, path } = JSON.parse(itemFromStorage) as DrawerLocalStorageValue;

                const url = APPS_CONFIGURATION[app as APP_NAMES]
                    ? getAppHref(path || '', app as APP_NAMES, authentication.getLocalID())
                    : undefined;

                if (app && isAppReachable) {
                    const isValidApp = getIsDrawerApp(app);
                    const canDisplayDrawerApp = getDisplayDrawerApp(APP_NAME, app);

                    if (!isValidApp || !canDisplayDrawerApp) {
                        return;
                    }

                    if (getIsIframedDrawerApp(app)) {
                        if (path && url) {
                            setIframeSrcMap((map) => ({
                                ...map,
                                [app]: url,
                            }));

                            setIframeURLMap((map) => ({
                                ...map,
                                [app]: url,
                            }));
                        } else {
                            /**
                             * Normally, this case should never happen.
                             * In case there is an iframed app reference stored in the localStorage without url,
                             * we will try to open the drawer app on parent app load, without any url.
                             *
                             * However, if we try to open an iframed app without url,
                             * it will result as a blank space in the drawer on which the user has no control.
                             * To avoid that, we will use en the default child app url.
                             */
                            // If no url is set, load the iframe on the default child app url
                            const localID = getLocalIDFromPathname(window.location.pathname);
                            const appHref = getAppHref('/', app, localID);
                            const defaultUrl = addParentAppToUrl(appHref, APP_NAME);

                            setIframeSrcMap((map) => ({
                                ...map,
                                [app]: defaultUrl,
                            }));

                            setIframeURLMap((map) => ({
                                ...map,
                                [app]: defaultUrl,
                            }));
                        }
                    }
                    setAppInView(app);
                }
            } catch (e: any) {
                console.error(e);
            }
        }
    }, []);
};

export default useOpenDrawerOnLoad;
