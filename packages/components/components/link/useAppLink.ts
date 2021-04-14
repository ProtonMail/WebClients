import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { APP_NAMES, APPS, isSSOMode, isStandaloneMode } from 'proton-shared/lib/constants';
import { getAppHref, getAppHrefBundle } from 'proton-shared/lib/apps/helper';

import { useConfig, useAuthentication } from '../../hooks';

const safeOpenNewTab = (href: string) => {
    const otherWindow = window.open();
    if (otherWindow) {
        otherWindow.location.href = href;
    }
};

const useAppLink = () => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();
    const history = useHistory();

    return useCallback(
        (to: string, toApp?: APP_NAMES, newTab?: boolean) => {
            if (toApp && toApp !== APP_NAME) {
                if (isSSOMode) {
                    const localID = authentication.getLocalID?.();
                    const href = getAppHref(to, toApp, localID);
                    if (newTab) {
                        return safeOpenNewTab(href);
                    }
                    return document.location.assign(href);
                }
                if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                    const href = getAppHref(to, toApp);
                    return safeOpenNewTab(href);
                }
                if (isStandaloneMode) {
                    return;
                }
                return document.location.assign(getAppHrefBundle(to, toApp));
            }
            return history.push(to);
        },
        [authentication]
    );
};

export default useAppLink;
