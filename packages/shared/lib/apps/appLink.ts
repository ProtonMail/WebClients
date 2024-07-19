import type { History } from 'history';

import type { AuthenticationStore } from '../authentication/createAuthenticationStore';
import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { appMode } from '../webpack.constants';
import { getAppHref, getAppHrefBundle } from './helper';

const safeOpenNewTab = (href: string) => {
    const otherWindow = window.open();
    if (otherWindow) {
        otherWindow.location.href = href;
    }
};

export const appLink = ({
    to,
    toApp,
    newTab,
    history,
    app,
    authentication,
}: {
    to: string;
    toApp?: APP_NAMES;
    newTab?: boolean;
    history: History;
    app: APP_NAMES;
    authentication: AuthenticationStore;
}) => {
    if (toApp && toApp !== app) {
        if (appMode === 'sso') {
            const localID = authentication.getLocalID?.();
            const href = getAppHref(to, toApp, localID);
            if (newTab) {
                return safeOpenNewTab(href);
            }
            return document.location.assign(href);
        }
        if (app === APPS.PROTONVPN_SETTINGS) {
            const href = getAppHref(to, toApp);
            return safeOpenNewTab(href);
        }
        if (appMode === 'standalone') {
            return;
        }
        return document.location.assign(getAppHrefBundle(to, toApp));
    }
    return history.push(to);
};
