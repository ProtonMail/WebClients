import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';

// We need to capture the pathname on page load. We otherwise end up in a situation where a side-effect overrides
// the pathname, and we have no mechanism to detect the parent app due to cross origin restrictions
const pathname = window.location.pathname;
const isIframe = getIsIframe();
const parentApp = getAppFromPathnameSafe(pathname);
const isDrawerApp = isIframe && parentApp && getIsAuthorizedApp(parentApp);
const view = (() => {
    if (parentApp === 'proton-mail') {
        return VIEWS.MAIL;
    }
    if (parentApp === 'proton-drive') {
        return VIEWS.DRIVE;
    }

    return undefined;
})();

/** Infos related to calendar in "drawer app" mode */
export const embeddedDrawerAppInfos = {
    isIframe,
    isDrawerApp,
    parentApp,
    view,
};
