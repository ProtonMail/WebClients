import { BrowserWindow, Menu, type Session, Tray, app, nativeImage, nativeTheme, session, shell } from 'electron';
import logger from 'electron-log/main';
import { join } from 'path';

import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';
import { getAppUrlFromApiUrl, getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import * as config from './app/config';
import { WINDOWS_APP_ID } from './constants';
import { migrateSameSiteCookies, upgradeSameSiteCookies } from './lib/cookies';
import { ARCH } from './lib/env';
import { getTheme } from './lib/theming';
import { getWindowConfig, registerWindowManagementHandlers } from './lib/window-management';
import { setApplicationMenu } from './menu-view/application-menu';
import { startup } from './startup';
import { certificateVerifyProc } from './tls';
import type { PassElectronContext } from './types';
import { SourceType, updateElectronApp } from './update';
import { isMac, isProdEnv, isWindows } from './utils/platform';

const ctx: PassElectronContext = { window: null, quitting: false };

const DOMAIN = getSecondLevelDomain(new URL(config.API_URL).hostname);

const createSession = () => {
    const partitionKey = ENV !== 'production' ? 'app-dev' : 'app';
    const secureSession = session.fromPartition(`persist:${partitionKey}`, { cache: false });

    const filter = { urls: [`${getAppUrlFromApiUrl(config.API_URL, APPS.PROTONPASS)}*`] };

    secureSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    if (isProdEnv()) {
        // Always use system DNS settings
        app.configureHostResolver({
            enableAdditionalDnsQueryTypes: false,
            enableBuiltInResolver: true,
            secureDnsMode: 'off',
            secureDnsServers: [],
        });

        // Use certificate pinning
        if (config.SSO_URL.endsWith('proton.me')) secureSession.setCertificateVerifyProc(certificateVerifyProc);

        secureSession.webRequest.onHeadersReceived({ urls: [`https://*.${DOMAIN}/*`] }, (details, callback) => {
            const { responseHeaders = {}, frame } = details;
            const appRequest = frame?.url?.startsWith('file://') ?? false;

            /** If the request is made from a `file://` url: migrate ALL `SameSite` directives
             * to `None` and allow cross-origin requests for the API. If not then only upgrade
             * EMPTY `SameSite` cookie directives to `None` to preserve `Session-ID` cookies */
            if (appRequest) {
                migrateSameSiteCookies(responseHeaders);
                responseHeaders['access-control-allow-origin'] = ['file://'];
                responseHeaders['access-control-allow-credentials'] = ['true'];
                responseHeaders['access-control-allow-headers'] = Object.keys(details.responseHeaders || {});
            } else upgradeSameSiteCookies(responseHeaders);

            callback({ cancel: false, responseHeaders });
        });
    }

    const clientId = ((): string => {
        const config = APPS_CONFIGURATION[APPS.PROTONPASS];

        switch (process.platform) {
            case 'win32':
                return config.windowsClientID || config.clientID;
            case 'darwin':
                return config.macosClientID || config.clientID;
            case 'linux':
                return config.linuxClientID || config.clientID;
            default:
                return config.clientID;
        }
    })();

    secureSession.webRequest.onBeforeSendHeaders(({ requestHeaders }, callback) =>
        callback({
            requestHeaders: {
                ...requestHeaders,
                ...getAppVersionHeaders(clientId, config.APP_VERSION),
            },
        })
    );

    // Intercept SSO login redirect to the Pass web app
    secureSession.webRequest.onBeforeRequest(filter, async (details, callback) => {
        if (!ctx.window) return;

        const url = new URL(details.url);
        if (url.pathname !== '/login') return callback({ cancel: false });

        callback({ cancel: true });
        const nextUrl = `${MAIN_WINDOW_WEBPACK_ENTRY}#/login${url.hash}`;
        await ctx.window.loadURL(nextUrl);
    });

    return secureSession;
};

const createWindow = async (session: Session): Promise<BrowserWindow> => {
    if (ctx.window) return ctx.window;

    const { x, y, minHeight, minWidth, height, width, maximized, zoomLevel } = getWindowConfig();

    ctx.window = new BrowserWindow({
        x,
        y,
        minHeight,
        minWidth,
        width,
        height,
        show: false,
        opacity: 1,
        autoHideMenuBar: true,
        webPreferences: {
            session: session,
            sandbox: true,
            contextIsolation: true,
            nodeIntegration: false,
            disableBlinkFeatures: 'Auxclick',
            devTools: Boolean(process.env.PASS_DEBUG) || !isProdEnv(),
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
        ...(isMac ? { titleBarStyle: 'hidden', frame: false } : { titleBarStyle: 'default' }),
        trafficLightPosition: {
            x: 20,
            y: 18,
        },
    });

    if (zoomLevel) {
        ctx.window.webContents.setZoomLevel(zoomLevel);
    }

    setApplicationMenu(ctx.window);
    registerWindowManagementHandlers(ctx.window);

    ctx.window.on('close', (e) => {
        if (!ctx.quitting) {
            e.preventDefault();
            ctx.window?.hide();
        }
    });

    ctx.window.on('closed', () => (ctx.window = null));

    await ctx.window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    ctx.window.show();

    if (maximized) {
        ctx.window.maximize();
    }

    return ctx.window;
};

const createTrayIcon = (session: Session) => {
    const trayIconName = (() => {
        switch (process.platform) {
            case 'darwin':
                return 'trayTemplate.png';
            case 'win32':
                return 'logo.ico';
            default:
                return 'tray.png';
        }
    })();

    const trayIconPath = join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'assets', trayIconName);
    const trayIcon = nativeImage.createFromPath(trayIconPath);
    const tray = new Tray(trayIcon);
    tray.setToolTip('Proton Pass');

    const onOpenPassHandler = async () => {
        const window = await createWindow(session);
        window.show();
    };

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Proton Pass', click: onOpenPassHandler },
        { type: 'separator' },
        { label: 'Quit', role: 'quit', click: app.quit },
    ]);

    tray.setContextMenu(contextMenu);

    if (process.platform === 'win32') tray.on('double-click', onOpenPassHandler);
};

const onActivate = (secureSession: Session) => () => {
    if (ctx.window) return ctx.window.show();
    if (BrowserWindow.getAllWindows().length === 0) return createWindow(secureSession);
};

if (!app.requestSingleInstanceLock()) app.quit();

await startup(ctx);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.addListener('ready', async () => {
    const secureSession = createSession();
    const handleActivate = onActivate(secureSession);

    // Match title bar with the saved (or default) theme
    nativeTheme.themeSource = getTheme();

    // Create tray icon
    createTrayIcon(secureSession);

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.addListener('activate', handleActivate);

    // On Windows, launching Pass while it's already running shold focus
    // or create the main window of the existing process
    app.addListener('second-instance', handleActivate);

    // Prevent hiding windows when explicitly quitting
    app.addListener('before-quit', () => (ctx.quitting = true));

    await createWindow(secureSession);

    updateElectronApp({
        session: secureSession,
        updateSource: {
            type: SourceType.StaticStorage,
            baseUrl: `https://proton.me/download/PassDesktop/${process.platform}/${ARCH}`,
        },
    });
});

app.addListener('web-contents-created', (_, contents) => {
    contents.addListener('will-attach-webview', (evt) => evt.preventDefault());

    const allowedHosts: string[] = [
        new URL(config.API_URL).host,
        new URL(config.SSO_URL).host,
        getAppUrlFromApiUrl(config.API_URL, APPS.PROTONPASS).host,
    ];

    contents.addListener('will-navigate', (evt, href) => {
        if (href.startsWith(MAIN_WINDOW_WEBPACK_ENTRY)) return;

        const url = new URL(href);

        // Prevent opening URLs outside of account
        if (!allowedHosts.includes(url.host) || !['/authorize', '/login'].includes(url.pathname)) {
            evt.preventDefault();
            logger.warn(`[will-navigate] preventDefault: ${url.toString()}`);
            return;
        }

        // Open Create account externally
        if (url.searchParams.has('t') && url.searchParams.get('t') === ForkType.SIGNUP) {
            evt.preventDefault();
            logger.warn(`[will-navigate] openExternal: ${url.toString()}`);
            return shell.openExternal(href).catch(noop);
        }
    });

    contents.setWindowOpenHandler(({ url: href }) => {
        const url = new URL(href);

        // Shell out to the system browser if http(s)
        if (['http:', 'https:', 'mailto:'].includes(url.protocol)) shell.openExternal(href).catch(noop);

        // Always deny opening external links in-app
        return { action: 'deny' };
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.addListener('window-all-closed', () => !isMac && app.quit());
app.addListener('will-finish-launching', () => isWindows && app.setAppUserModelId(WINDOWS_APP_ID));
