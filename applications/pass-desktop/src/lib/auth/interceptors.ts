import { shell } from 'electron';

import { ForkSearchParameters, ForkType } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import config from '../../app/config';
import type { PassElectronContext } from '../../types';
import logger from '../../utils/logger';
import { PLATFORM_CLIENT_ID } from '../env';
import {
    deepLinkAuthCallback,
    getExternalLoginUrl,
    getLoginUrl,
    handleDeepLink,
    isDeepLinkSupported,
} from './deep-link';

export const authInterceptors = (app: Electron.App, ctx: PassElectronContext) => {
    app.addListener('web-contents-created', (_, contents) => {
        contents.addListener('will-attach-webview', (evt) => evt.preventDefault());

        const allowedHosts: string[] = [
            new URL(config.API_URL).host,
            new URL(config.SSO_URL).host,
            getAppUrlFromApiUrl(config.API_URL, APPS.PROTONPASS).host,
        ];

        contents.addListener('will-navigate', (evt) => {
            // Do nothing if navigating to the bundled web app
            if (evt.url.startsWith(MAIN_WINDOW_WEBPACK_ENTRY)) return;

            const url = new URL(evt.url);

            // Open 'Create account' externally
            if (
                url.origin === config.SSO_URL &&
                url.pathname === '/authorize' &&
                url.searchParams.get('t') === ForkType.SIGNUP
            ) {
                evt.preventDefault();
                logger.debug(`[will-navigate] allow (external): ${url.toString()}`);
                void ctx.window?.loadURL(getExternalLoginUrl());
                return shell.openExternal(url.href).catch(noop);
            }

            // External login flow: route /authorize and /login to external browser
            if (allowedHosts.includes(url.host) && ['/authorize', '/login'].includes(url.pathname)) {
                if (!isDeepLinkSupported()) {
                    logger.info(`[will-navigate] allow (main frame): ${url.href}`);
                    return;
                }

                evt.preventDefault();

                // Add redirectUrl parameter for deep link callback
                url.searchParams.set('redirectUrl', deepLinkAuthCallback);

                // Add app parameter so account knows which app the fork is for
                url.searchParams.set(ForkSearchParameters.App, APPS.PROTONPASS);

                // Push the fork to the desktop client ID instead of the web one
                url.searchParams.set(ForkSearchParameters.ChildClientID, PLATFORM_CLIENT_ID);

                logger.info(`[will-navigate] external login with redirect: ${url.href}`);

                void ctx.window?.loadURL(getExternalLoginUrl());

                return shell.openExternal(url.href).catch(noop);
            }

            // Allow SSO flows (happens in a dedicated window)
            if (
                evt.initiator?.url?.startsWith(config.SSO_URL) ||
                ctx.window?.webContents.getURL().startsWith(config.SSO_URL)
            ) {
                logger.info(`[will-navigate] allow (external frame): ${url.href}`);
                return;
            }

            // Let OS handle anything else
            evt.preventDefault();
            logger.info(`[will-navigate] allow (external): ${url.href}`);
            return shell.openExternal(evt.url).catch(noop);
        });

        contents.setWindowOpenHandler(({ url: href }) => {
            const url = new URL(href);

            // Open a new window for SSO
            if (url.origin === config.SSO_URL && url.pathname.match(/(\/api)?\/auth\/sso/)) {
                logger.info(`[setWindowOpenHandler] opening url in window: ${href}`);
                return { action: 'allow' };
            }

            // Shell out to the OS handler for http(s) and mailto
            if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
                logger.info(`[setWindowOpenHandler] opening url externally: ${href}`);
                shell.openExternal(href).catch(noop);
            }

            // Always deny opening extra windows
            return { action: 'deny' };
        });
    });

    // Deep link entry point for macOS (warm + cold launch).
    // Windows delivers deep links through process.argv — see main.ts.
    app.addListener('open-url', (event, url) => {
        event.preventDefault();
        handleDeepLink(url, ctx);
    });

    const filter = { urls: [`${getAppUrlFromApiUrl(config.API_URL, APPS.PROTONPASS)}*`] };

    ctx.session?.webRequest.onBeforeRequest(filter, async (details, callback) => {
        // If deep links are supported, allow external redirection and stop there
        if (isDeepLinkSupported()) return callback({ cancel: false });

        const url = new URL(details.url);
        if (url.pathname !== '/login') return callback({ cancel: false });

        if (!ctx.window) return callback({ cancel: false });

        logger.info(`[webRequest.onBeforeRequest] loading url in webview: ${details.url}`);

        callback({ cancel: true });
        await ctx.window.loadURL(getLoginUrl(url.hash));
    });
};
