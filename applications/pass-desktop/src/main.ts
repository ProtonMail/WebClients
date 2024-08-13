import {
    BrowserWindow,
    type Event,
    Menu,
    type Session,
    Tray,
    app,
    nativeImage,
    nativeTheme,
    session,
    shell,
} from 'electron';
import logger from 'electron-log/main';
import { join } from 'path';

import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';
import { getAppUrlFromApiUrl, getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import * as config from './app/config';
import './lib/biometrics';
import './lib/clipboard';
import { migrateSameSiteCookies, upgradeSameSiteCookies } from './lib/cookies';
import { ARCH } from './lib/env';
import { setApplicationMenu } from './menu-view/application-menu';
import { startup } from './startup';
import { certificateVerifyProc } from './tls';
import { SourceType, updateElectronApp } from './update';
import { isMac, isProdEnv, isWindows } from './utils/platform';

await startup();

export let mainWindow: BrowserWindow | null;

let isAppQuitting = false;

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

    const appVersionHeaders = getAppVersionHeaders(clientId, config.APP_VERSION);
    secureSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const requestHeaders = {
            ...details.requestHeaders,
            ...appVersionHeaders,
        };

        callback({ requestHeaders });
    });

    // Intercept SSO login redirect to the Pass web app
    secureSession.webRequest.onBeforeRequest(filter, async (details, callback) => {
        if (!mainWindow) return;

        const url = new URL(details.url);
        const isLoginUrl = url.pathname === '/login';

        if (!isLoginUrl) {
            callback({ cancel: false });
            return;
        }

        callback({ cancel: true });
        const nextUrl = `${MAIN_WINDOW_WEBPACK_ENTRY}#/login${url.hash}`;
        await mainWindow.loadURL(nextUrl);
    });

    return secureSession;
};

const createWindow = async (session: Session): Promise<BrowserWindow> => {
    mainWindow = new BrowserWindow({
        show: false,
        width: 960,
        height: 640,
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
        titleBarStyle: isMac ? 'hidden' : 'default',
        trafficLightPosition: {
            x: 20,
            y: 18,
        },
        minWidth: 881,
        minHeight: 480,
    });

    setApplicationMenu(mainWindow);

    mainWindow.on('close', (e) => {
        if (isAppQuitting) return;
        e.preventDefault();
        mainWindow?.hide();
    });

    mainWindow.on('closed', () => (mainWindow = null));

    await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    mainWindow.show();
    return mainWindow;
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
        const window = mainWindow || (await createWindow(session));
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
    if (mainWindow) return mainWindow.show();
    if (BrowserWindow.getAllWindows().length === 0) return createWindow(secureSession);
};

if (!app.requestSingleInstanceLock()) app.quit();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.addListener('ready', async () => {
    const secureSession = createSession();
    const handleActivate = onActivate(secureSession);

    // Use dark title bar
    nativeTheme.themeSource = 'dark';

    // Create tray icon
    createTrayIcon(secureSession);

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.addListener('activate', handleActivate);

    // On Windows, launching Pass while it's already running shold focus
    // or create the main window of the existing process
    app.addListener('second-instance', handleActivate);

    // Prevent hiding windows when explicitly quitting
    app.addListener('before-quit', () => (isAppQuitting = true));

    await createWindow(secureSession);

    updateElectronApp({
        session: secureSession,
        updateSource: {
            type: SourceType.StaticStorage,
            baseUrl: `https://proton.me/download/PassDesktop/${process.platform}/${ARCH}`,
        },
    });
});

app.addListener('web-contents-created', (_ev, contents) => {
    const preventDefault = (e: Event) => e.preventDefault();

    contents.addListener('will-attach-webview', preventDefault);

    const allowedHosts: string[] = [
        new URL(config.API_URL).host,
        new URL(config.SSO_URL).host,
        getAppUrlFromApiUrl(config.API_URL, APPS.PROTONPASS).host,
    ];

    contents.addListener('will-navigate', (e, href) => {
        if (href.startsWith(MAIN_WINDOW_WEBPACK_ENTRY)) return;

        const url = new URL(href);

        // Prevent opening URLs outside of account
        if (!allowedHosts.includes(url.host) || !['/authorize', '/login'].includes(url.pathname)) {
            e.preventDefault();
            logger.warn(`[will-navigate] preventDefault: ${url.toString()}`);
            return;
        }

        // Open Create account externally
        if (url.searchParams.has('t')) {
            e.preventDefault();
            logger.warn(`[will-navigate] openExternal: ${url.toString()}`);
            return shell.openExternal(href).catch(noop);
        }
    });

    contents.setWindowOpenHandler(({ url: href }) => {
        const url = new URL(href);

        // Shell out to the system browser if http(s)
        if (['http:', 'https:'].includes(url.protocol)) shell.openExternal(href).catch(noop);

        // Always deny opening external links in-app
        return { action: 'deny' };
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.addListener('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});

const windowsAppId = 'com.squirrel.proton_pass_desktop.ProtonPass';
app.addListener('will-finish-launching', () => {
    if (isWindows) app.setAppUserModelId(windowsAppId);
});
