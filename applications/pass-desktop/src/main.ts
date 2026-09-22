import { BrowserWindow, Menu, type Session, Tray, app, autoUpdater, nativeImage, nativeTheme, session } from 'electron';
import { join } from 'path';

import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import config from './app/config';
import { WINDOWS_APP_ID } from './constants';
import { handleDeepLink, pickDeepLinkFromArgv, testDeepLinkSupport } from './lib/auth/deep-link';
import { authInterceptors } from './lib/auth/interceptors';
import { migrateSameSiteCookies, upgradeSameSiteCookies } from './lib/cookies';
import { PLATFORM_CLIENT_ID } from './lib/env';
import { fixSSOUrl } from './lib/sso';
import { getTheme } from './lib/theming';
import { setTagCookie } from './lib/updater/helpers';
import { getUpdateStore } from './lib/updater/store';
import { startUpdater } from './lib/updater/updater';
import { userAgent } from './lib/user-agent';
import { onHideWindow } from './lib/window';
import { getWindowConfig, registerWindowManagementHandlers } from './lib/window-management';
import { setApplicationMenu } from './menu-view/application-menu';
import { startup } from './startup';
import { certificateVerifyProc } from './tls';
import type { PassElectronContext } from './types';
import logger from './utils/logger';
import { isMac, isProdEnv, isWindows } from './utils/platform';

const ctx: PassElectronContext = { session: null, window: null, quitting: false };

const DOMAIN = getSecondLevelDomain(new URL(config.API_URL).hostname);

const createSession = () => {
    const partitionKey = ENV !== 'production' ? 'app-dev' : 'app';
    const secureSession = session.fromPartition(`persist:${partitionKey}`, { cache: false });

    secureSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    // Use certificate pinning
    secureSession.setCertificateVerifyProc(certificateVerifyProc);

    secureSession.webRequest.onHeadersReceived({ urls: [`https://*.${DOMAIN}/*`] }, (details, callback) => {
        // FIXME: Temporary bypass for SSO callback using the wrong protocol
        fixSSOUrl(details);

        if (isProdEnv()) {
            if (!details.responseHeaders) details.responseHeaders = {};
            const { responseHeaders, frame } = details;
            const appRequest = frame?.url?.startsWith('file://') ?? false;

            /** If the request is made from a `file://` url: migrate ALL `SameSite` directives
             * to `None` and allow cross-origin requests for the API. If not then only upgrade
             * EMPTY `SameSite` cookie directives to `None` to preserve `Session-ID` cookies */
            if (appRequest) {
                migrateSameSiteCookies(responseHeaders);
                responseHeaders['access-control-allow-headers'] = Object.keys(responseHeaders);
                responseHeaders['access-control-allow-origin'] = ['file://'];
                responseHeaders['access-control-allow-credentials'] = ['true'];
            } else upgradeSameSiteCookies(responseHeaders);
        }

        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });

    secureSession.webRequest.onBeforeSendHeaders(({ requestHeaders }, callback) =>
        callback({
            requestHeaders: {
                ...requestHeaders,
                ...getAppVersionHeaders(PLATFORM_CLIENT_ID, config.APP_VERSION),
            },
        })
    );

    secureSession.setUserAgent(userAgent());

    void setTagCookie(secureSession, getUpdateStore().beta);

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
        icon: join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'assets', 'logo.png'),
        webPreferences: {
            session: session,
            sandbox: true,
            contextIsolation: true,
            nodeIntegration: false,
            disableBlinkFeatures: 'Auxclick',
            devTools: Boolean(process.env.PASS_DEBUG) || !isProdEnv(),
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
        ...(isMac() ? { titleBarStyle: 'hidden', frame: false } : { titleBarStyle: 'default' }),
        trafficLightPosition: {
            x: 20,
            y: 18,
        },
        acceptFirstMouse: true,
    });

    if (zoomLevel) {
        ctx.window.webContents.setZoomLevel(zoomLevel);
    }

    setApplicationMenu(ctx.window);
    registerWindowManagementHandlers(ctx.window);

    ctx.window.on('show', () => {
        if (isMac()) void app.dock?.show();
    });

    ctx.window.on('close', (e) => {
        if (!ctx.quitting) {
            e.preventDefault();
            ctx.window?.hide();
            onHideWindow(() => ctx.window);
            if (isMac()) app.dock?.hide();
        }
    });

    ctx.window.on('closed', () => (ctx.window = null));

    // Flush DOMStorage (the persisted session blob) to disk before the OS
    // reboots/shuts down, as a safeguard against losing the latest write.
    ctx.window.on('session-end', () => {
        logger.info('[storage] session-end: flushing DOMStorage before shutdown');
        ctx.session?.flushStorageData();
    });

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

if (!app.requestSingleInstanceLock()) {
    // Hard-exit: app.quit() is async and would let the rest of this module
    // keep running — including testDeepLinkSupport(), which would fire
    // another protonpass://test and spawn yet another instance. Fork-bomb.
    // Nothing has been initialised yet at this point so no cleanup is owed.
    process.exit(0);
}

// Startup all Pass handlers
const cleanup = await startup(app, ctx);

// Wait for Electron to be initialized
await app.whenReady();

// Always use system DNS settings
app.configureHostResolver({
    enableAdditionalDnsQueryTypes: false,
    enableBuiltInResolver: true,
    secureDnsMode: 'off',
    secureDnsServers: [],
});

ctx.session = createSession();

authInterceptors(app, ctx);

testDeepLinkSupport();

// Match title bar with the saved (or default) theme
nativeTheme.themeSource = getTheme();

const handleActivate = onActivate(ctx.session);

// Create tray icon
createTrayIcon(ctx.session);

// On OS X it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.addListener('activate', handleActivate);

// On Windows, launching Pass while it's already running should focus
// or create the main window of the existing process. The second instance
// argv is also where Windows delivers a protonpass:// deep link.
app.addListener('second-instance', async (_, argv) => {
    await handleActivate();
    const url = pickDeepLinkFromArgv(argv);
    if (url) handleDeepLink(url, ctx);
});

// Prevent hiding windows when explicitly quitting. `quitAndInstall()` does not emit `before-quit`
// before closing windows, so `before-quit-for-update` must be handled too — otherwise the
// hide-to-tray close handler keeps the app alive and the update install never completes.
app.addListener('before-quit', () => (ctx.quitting = true));
autoUpdater.addListener('before-quit-for-update', () => (ctx.quitting = true));

await createWindow(ctx.session);

// Windows cold-launch via deep link: the OS spawns the app with the URL
// in process.argv. Has no effect on macOS (open-url fires instead).
const coldLaunchDeepLink = pickDeepLinkFromArgv(process.argv);
if (coldLaunchDeepLink) handleDeepLink(coldLaunchDeepLink, ctx);

startUpdater(ctx.session);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.addListener('window-all-closed', () => !isMac() && app.quit());
app.addListener('will-finish-launching', () => isWindows() && app.setAppUserModelId(WINDOWS_APP_ID));

// Call cleanup functions when quitting
let exiting = false;
app.addListener('will-quit', async (event) => {
    if (exiting) return;
    event.preventDefault();
    exiting = true;
    await cleanup();
    app.exit(0);
});
