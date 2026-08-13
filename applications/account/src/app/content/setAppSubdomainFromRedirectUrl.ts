import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getValidatedRedirectUrl } from '@proton/shared/lib/authentication/fork/getValidatedRedirectUrl';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

/**
 * This is a temporary workaround for apps hosted on different domains. This is a hack but the least invasive way
 * to do it. We should be able to remove it relatively soon.
 */
export const maybeSetAppSubdomainFromRedirectUrl = (url: URL) => {
    const value = url.searchParams.get('redirectUrl');
    if (!value || !URL.canParse(value)) {
        return;
    }
    const redirectUrl = new URL(value);
    const app = getAppFromPathnameSafe(url.pathname);
    if (!app) {
        return;
    }
    const appUrl = new URL(getAppHref('/', app, undefined, url));
    const validatedRedirectUrl = getValidatedRedirectUrl({ url: appUrl, redirectUrl, app });
    if (!validatedRedirectUrl) {
        return;
    }
    if (validatedRedirectUrl.hostname === 'localhost') {
        return;
    }
    const secondLevelDomain = getSecondLevelDomain(validatedRedirectUrl.host);
    const newSubdomain = validatedRedirectUrl.host.replace(`.${secondLevelDomain}`, '');
    APPS_CONFIGURATION[app].subdomain = newSubdomain;
};
