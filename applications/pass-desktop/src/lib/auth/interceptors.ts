import { shell } from 'electron';

import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import config from '../../app/config';
import type { PassElectronContext } from '../../types';
import logger from '../../utils/logger';
import { getLoggableUrl, getOriginHref, isMainWindowEntry } from '../../utils/navigation';
import { getLoginUrl, handleDeepLink } from './deep-link';

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
            if (isMainWindowEntry(evt.url)) return;

            const url = new URL(evt.url);

            // Open 'Create account' externally
            if (
                url.origin === config.SSO_URL &&
                url.pathname === '/authorize' &&
                url.searchParams.get('t') === ForkType.SIGNUP
            ) {
                evt.preventDefault();
                logger.debug(`[will-navigate] allow (external): ${getLoggableUrl(url.href)}`);
                return shell.openExternal(url.href).catch(noop);
            }

            // In-app sign in: /authorize and /login load in the main frame
            if (allowedHosts.includes(url.host) && ['/authorize', '/login'].includes(url.pathname)) {
                logger.info(`[will-navigate] allow (main frame): ${getLoggableUrl(url.href)}`);
                if (isMainWindowEntry(contents.getURL())) ctx.originHref = getOriginHref(contents.getURL());
                return;
            }

            // Allow SSO flows (happens in a dedicated window)
            if (
                evt.initiator?.url?.startsWith(config.SSO_URL) ||
                ctx.window?.webContents.getURL().startsWith(config.SSO_URL)
            ) {
                logger.info(`[will-navigate] allow (external frame): ${getLoggableUrl(url.href)}`);
                return;
            }

            // Let OS handle anything else
            evt.preventDefault();
            logger.info(`[will-navigate] allow (external): ${getLoggableUrl(url.href)}`);
            return shell.openExternal(evt.url).catch(noop);
        });

        contents.setWindowOpenHandler(({ url: href }) => {
            const url = new URL(href);

            // Open a new window for SSO
            if (url.origin === config.SSO_URL && url.pathname.match(/(\/api)?\/auth\/sso/)) {
                logger.info(`[setWindowOpenHandler] opening url in window: ${getLoggableUrl(href)}`);
                return { action: 'allow' };
            }

            // Shell out to the OS handler for http(s) and mailto
            if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
                logger.info(`[setWindowOpenHandler] opening url externally: ${getLoggableUrl(href)}`);
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
        const url = new URL(details.url);
        if (url.pathname !== '/login') return callback({ cancel: false });

        if (!ctx.window) return callback({ cancel: false });

        logger.info(`[webRequest.onBeforeRequest] loading url in webview: ${details.url}`);

        callback({ cancel: true });
        await ctx.window.loadURL(getLoginUrl(url.hash));
    });
};
