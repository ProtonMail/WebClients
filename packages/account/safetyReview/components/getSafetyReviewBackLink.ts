import { c } from 'ttag';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { getAppFromHostname, getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

const getUrl = (backHref: string, defaultUrl: URL) => {
    if (!URL.canParse(backHref)) {
        return defaultUrl;
    }
    const backUrl = new URL(backHref);
    if (getSecondLevelDomain(backUrl.hostname) !== getSecondLevelDomain(defaultUrl.hostname)) {
        return defaultUrl;
    }
    return backUrl;
};

export const getBackCopy = (backLink: SafetyReviewBackLink) => {
    return c('safety_review').t`Back to ${backLink.appNameString}`;
};

export interface SafetyReviewBackLink {
    context: 'settings' | 'app';
    appName: APP_NAMES;
    appNameString: string;
    to: string;
    href: string;
}

export const getSafetyReviewBackLink = (backHref: string): SafetyReviewBackLink => {
    const defaultUrl = new URL('/mail/recovery', window.location.origin);
    const backUrl = getUrl(backHref, defaultUrl);
    const appName = getAppFromPathnameSafe(backUrl.pathname) || getAppFromHostname(backUrl.hostname) || APPS.PROTONMAIL;
    return {
        context: backUrl.origin === defaultUrl.origin ? 'settings' : 'app',
        appName,
        appNameString: getAppName(appName),
        to: stripLocalBasenameFromPathname(backUrl.pathname),
        href: backUrl.href,
    };
};
