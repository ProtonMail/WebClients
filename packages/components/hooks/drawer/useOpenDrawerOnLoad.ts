import { useEffect } from 'react';

import { useConfig, useDrawer, useFeature, useOnline } from '@proton/components/hooks';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { LOCALSTORAGE_DRAWER_KEY } from '@proton/shared/lib/drawer/constants';
import {
    addParentAppToUrl,
    getDisplayDrawerApp,
    getIsDrawerApp,
    getIsIframedDrawerApp,
} from '@proton/shared/lib/drawer/helpers';
import { DrawerLocalStorageValue } from '@proton/shared/lib/drawer/interfaces';
import { getItem } from '@proton/shared/lib/helpers/storage';
import { DrawerFeatureFlag } from '@proton/shared/lib/interfaces/Drawer';
import window from '@proton/shared/lib/window';

import { FeatureCode } from '../../containers';

const useOpenDrawerOnLoad = () => {
    const { APP_NAME } = useConfig();
    const { offline } = useApiStatus();
    const onlineStatus = useOnline();
    const { feature: drawerFeature } = useFeature<DrawerFeatureFlag>(FeatureCode.Drawer);
    const { setIframeSrcMap, setIframeURLMap, setAppInView } = useDrawer();

    const isAppReachable = !offline && onlineStatus;

    useEffect(() => {
        if (!drawerFeature) {
            return;
        }

        const itemFromStorage = getItem(LOCALSTORAGE_DRAWER_KEY);
        if (itemFromStorage) {
            // Surround JSON.parse by try/catch in case the value cannot be parsed
            try {
                const { app, url } = JSON.parse(itemFromStorage) as DrawerLocalStorageValue;

                if (app && isAppReachable) {
                    const isValidApp = getIsDrawerApp(app);
                    const canDisplayDrawerApp = getDisplayDrawerApp(APP_NAME, app, drawerFeature);

                    if (!isValidApp || !canDisplayDrawerApp) {
                        return;
                    }

                    if (getIsIframedDrawerApp(app)) {
                        if (url) {
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
                // eslint-disable-next-line no-console
                console.error(e);
            }
        }
    }, []);
};

export default useOpenDrawerOnLoad;
