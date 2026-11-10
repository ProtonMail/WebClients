import type { PassElectronContext } from '../../types';
import logger from '../../utils/logger';

const deepLinkProtocol = 'protonpass://';
const deepLinkAuthCallback = `${deepLinkProtocol}login`;

/** Builds the bundled web app URL for the `/login` route, preserving the
 * fork hash. Used by the in-app sign-in, where account redirects the
 * window to the web app `/login` route. */
export const getLoginUrl = (hash: string) => `${MAIN_WINDOW_WEBPACK_ENTRY}#/login${hash}`;

/** Find the first protonpass:// entry in a CLI argv array.
 * Windows/Linux deliver deep links as command-line arguments rather than
 * through Electron's open-url event. */
export const pickDeepLinkFromArgv = (argv: string[]): string | undefined =>
    argv.find((arg) => arg.startsWith(deepLinkProtocol));

/** Single dispatch point for incoming deep links, regardless of platform
 * or entry point (open-url, second-instance argv, cold-launch argv). */
export const handleDeepLink = (url: string, ctx: PassElectronContext) => {
    logger.info('[deep-link] received');

    if (!url.startsWith(deepLinkProtocol)) return;

    /** The device flow sign-in carries no data: the app polls the fork itself.
     * Account's success page only links back to surface the window. */
    if (url.startsWith(deepLinkAuthCallback)) {
        ctx.window?.show();
        return;
    }

    /** `deepLinkAuthCallback` must stay in sync with `SSO_PATHS.FORK`: account
     * discards the redirect url path and rebuilds the deep link from it, so a
     * rename there lands here instead of the branch above. Logged without the
     * query or fragment, which can carry fork parameters. */
    logger.error(`[deep-link] unhandled deep link: ${url.split(/[?#]/)[0]}`);
};
