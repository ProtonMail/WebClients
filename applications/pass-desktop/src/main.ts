import {
    BrowserWindow,
    type Event,
    type Session,
    app,
    clipboard,
    ipcMain,
    nativeTheme,
    session,
    shell,
} from 'electron';
import logger from 'electron-log/main';

import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';
import { getAppUrlFromApiUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import * as config from './app/config';
import { arch } from './lib/utils/helpers';
import { isSquirrelStartup } from './startup';
import { certificateVerifyProc } from './tls';
import { SourceType, updateElectronApp } from './update';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (isSquirrelStartup()) app.quit();

let mainWindow: BrowserWindow | null;

const createSession = () => {
    const paritionKey = ENV !== 'production' ? 'app-dev' : 'app';
    const secureSession = session.fromPartition(`persist:${paritionKey}`, { cache: false });

    const filter = { urls: [`${getAppUrlFromApiUrl(config.API_URL, APPS.PROTONPASS)}*`] };

    secureSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

    if (app.isPackaged) {
        // Use certificate pinning
        secureSession.setCertificateVerifyProc(certificateVerifyProc);

        // Allow cross-origin requests when fetching favicon blobs and similar from the API
        secureSession.webRequest.onHeadersReceived({ urls: [`${config.API_URL}/*`] }, (details, callback) => {
            const responseHeaders = {
                ...details.responseHeaders,
                'access-control-allow-origin': 'file://',
                'access-control-allow-credentials': 'true',
                'access-control-allow-headers': Object.keys(details.responseHeaders || {}),
            };

            callback({ responseHeaders });
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
        secureSession
            .clearStorageData({ storages: ['cookies'] })
            .catch((e) => logger.warn(`[Cookies] Could not clear cookies after SSO login`, e));
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
            devTools: Boolean(process.env.PASS_DEBUG) || !app.isPackaged,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
        titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
        trafficLightPosition: {
            x: 20,
            y: 18,
        },
        minWidth: 881,
        minHeight: 480,
    });

    mainWindow.on('closed', () => (mainWindow = null));

    mainWindow.webContents.addListener('did-finish-load', () => mainWindow?.show());

    await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    return mainWindow;
};

const onActivate = (secureSession: Session) => async () => {
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

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.addListener('activate', handleActivate);

    // On Windows, launching Pass while it's already running shold focus
    // or create the main window of the existing process
    app.addListener('second-instance', handleActivate);

    await createWindow(secureSession);

    updateElectronApp({
        session: secureSession,
        updateSource: {
            type: SourceType.StaticStorage,
            baseUrl: `https://proton.me/download/PassDesktop/${process.platform}/${arch}`,
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
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const windowsAppId = 'com.squirrel.proton_pass_desktop.ProtonPass';
app.addListener('will-finish-launching', () => {
    if (process.platform === 'win32') app.setAppUserModelId(windowsAppId);
});

let clipboardTimer: NodeJS.Timeout;
ipcMain.handle('clipboard:writeText', (_event, text) => {
    clearTimeout(clipboardTimer);
    clipboard.writeText(text);
    clipboardTimer = setTimeout(clipboard.clear, 30_000);
});
