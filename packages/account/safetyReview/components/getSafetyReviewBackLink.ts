import { c } from 'ttag';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { getAppFromHostname, getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
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

/** @param app the app serving the review, used when the back link itself doesn't identify a product. */
export const getSafetyReviewBackLink = (backHref: string, app: APP_NAMES): SafetyReviewBackLink => {
    // Every settings app serves recovery at the same path: standalone apps at their root, Account as generic
    // settings, i.e. without a product slug.
    const defaultUrl = new URL('/recovery', window.location.origin);
    const backUrl = getUrl(backHref, defaultUrl);
    // Account hosts every product behind a slug (/u/0/vpn/recovery) and in-app links carry the product in the
    // hostname. Standalone settings apps have neither, so the app serving the review is the product.
    const appName = getAppFromPathnameSafe(backUrl.pathname) || getAppFromHostname(backUrl.hostname) || app;
    return {
        context: backUrl.origin === defaultUrl.origin ? 'settings' : 'app',
        appName,
        appNameString: getAppName(appName),
        to: stripLocalBasenameFromPathname(backUrl.pathname),
        href: backUrl.href,
    };
};
