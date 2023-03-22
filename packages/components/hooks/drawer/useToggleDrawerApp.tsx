import { Dispatch, SetStateAction } from 'react';

import { useConfig, useOnline } from '@proton/components/hooks';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { addParentAppToUrl, getIsIframedDrawerApp, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS, IframeSrcMap, OpenDrawerArgs } from '@proton/shared/lib/drawer/interfaces';

interface Props {
    appInView: DRAWER_APPS | undefined;
    setAppInView: Dispatch<SetStateAction<DRAWER_APPS | undefined>>;
    iframeSrcMap: IframeSrcMap;
    setIframeSrcMap: Dispatch<SetStateAction<IframeSrcMap>>;
}

const useToggleDrawerApp = ({ appInView, setAppInView, iframeSrcMap, setIframeSrcMap }: Props) => {
    const { offline } = useApiStatus();
    const onlineStatus = useOnline();
    const { APP_NAME: currentApp } = useConfig();

    const isAppReachable = !offline && onlineStatus;

    return (args: OpenDrawerArgs) => () => {
        const { app, path = '/' } = args;
        const isAppOpened = app === appInView;

        setAppInView(isAppOpened ? undefined : app);

        // If we show again the child app that was cached, we post a message to it in case it needs to take some actions upon becoming visible again (like updating its state)
        if (!isAppOpened) {
            postMessageToIframe(
                {
                    type: DRAWER_EVENTS.SHOW,
                },
                app
            );
        }

        if (getIsIframedDrawerApp(app) && !iframeSrcMap[app] && isAppReachable) {
            const localID = getLocalIDFromPathname(window.location.pathname);
            const appHref = getAppHref(path, app, localID);

            setIframeSrcMap((map) => ({
                ...map,
                [app]: addParentAppToUrl(appHref, currentApp),
            }));
        }
    };
};

export default useToggleDrawerApp;
