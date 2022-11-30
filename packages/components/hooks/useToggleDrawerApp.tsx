import { Dispatch, SetStateAction } from 'react';

import { useConfig, useOnline } from '@proton/components/hooks/index';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { addParentAppToUrl, getIsIframedDrawerApp } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, IframeSrcMap, OpenDrawerArgs } from '@proton/shared/lib/drawer/interfaces';

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

        setAppInView(app !== appInView ? app : undefined);
        if (getIsIframedDrawerApp(app) && !iframeSrcMap[app] && isAppReachable) {
            // load the iframe
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
