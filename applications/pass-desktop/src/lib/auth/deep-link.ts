import { shell } from 'electron';

import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork/constants';

import type { PassElectronContext } from '../../types';
import logger from '../../utils/logger';

let deepLinkSupported = false;

/** Every fork selector this process has already dispatched. Tracking the full
 * set rather than just the last one matters when several logins happen in one
 * app run: an older success page is still open and clickable, and its selector
 * would otherwise no longer be recognised as spent. Selectors are short and
 * logins per run are few, so growth is negligible and dies with the process. */
const consumedSelectors = new Set<string>();

export const deepLinkProtocol = 'protonpass://';
export const deepLinkTestUrl = `${deepLinkProtocol}test`;
export const deepLinkAuthCallback = `${deepLinkProtocol}login`;

export const isDeepLinkSupported = () => deepLinkSupported;

/** Builds the bundled web app URL for the `/login` route, preserving the
 * fork hash. Shared between the deep-link callback and the webview fallback
 * in `interceptors.ts` so both entry points resolve to the same route. */
export const getLoginUrl = (hash: string) => `${MAIN_WINDOW_WEBPACK_ENTRY}#/login${hash}`;

/** Bundled web app route shown while the user completes sign-in
 * in the external browser. */
export const getExternalLoginUrl = () => `${MAIN_WINDOW_WEBPACK_ENTRY}#/auth/external`;

/** Test if deep links are supported by this OS/installation.
 * Fire-and-forget: `deepLinkSupported` only flips to `true` once the OS
 * round-trips `protonpass://test` back through `open-url`/`second-instance`
 * (see `handleDeepLinkReceived`). Until then `isDeepLinkSupported()` reports
 * `false`, so any login navigation during this startup window falls back to
 * the in-app webview flow even where deep links work. */
export const testDeepLinkSupport = () => {
    shell.openExternal(deepLinkTestUrl).catch(() => {
        deepLinkSupported = false;
    });
};

/** Called when a deep link is received. Resolves any pending test. */
export const handleDeepLinkReceived = () => {
    deepLinkSupported = true;
};

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

    if (url.startsWith(deepLinkTestUrl)) {
        handleDeepLinkReceived();
        return;
    }

    if (url.startsWith(deepLinkAuthCallback)) {
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) {
            logger.error('[deep-link] no hash found in auth callback URL');
            return;
        }

        const hash = url.substring(hashIndex);
        const selector = new URLSearchParams(hash.slice(1)).get(ForkSearchParameters.Selector);

        /** A fork selector is single-use: re-consuming it fails, and the failure
         * path tears down the session the first consumption just created. The
         * account success page auto-redirects *and* offers an "Open Proton Pass"
         * fallback button, so the same link routinely arrives twice. Honour what
         * the button actually promises and surface the window instead. */
        if (selector !== null && consumedSelectors.has(selector)) {
            logger.info('[deep-link] selector already consumed, showing window');
            ctx.window?.show();
            return;
        }

        if (selector !== null) consumedSelectors.add(selector);

        void ctx.window
            ?.loadURL(getLoginUrl(hash))
            // Force a page reload so even if only the hash is changed
            // we're ensured the new login will be considered as new
            .then(() => ctx.window?.reload());
        return;
    }

    /** `deepLinkAuthCallback` must stay in sync with `SSO_PATHS.FORK`: account
     * discards the redirect url path and rebuilds the deep link from it, so a
     * rename there lands here instead of the branch above. Logged without the
     * query or fragment, which carry the fork selector and encryption key. */
    logger.error(`[deep-link] unhandled deep link: ${url.split(/[?#]/)[0]}`);
};
