import { type BrowserWindow, type Rectangle, app, screen } from 'electron';

import type { Optional } from '@proton/shared/lib/interfaces';
import debounce from '@proton/utils/debounce';

import { store } from '../store';

export type WindowConfigStoreProperties = {
    x: number;
    y: number;
    width: number;
    height: number;
    zoomLevel: number;
    maximized: boolean;
};

type WindowConfigProperties = Optional<WindowConfigStoreProperties> & {
    minWidth: number;
    minHeight: number;
};

const DEFAULT_CONFIG: WindowConfigProperties = {
    height: 680,
    maximized: false,
    minHeight: 680,
    minWidth: 881,
    width: 960,
    zoomLevel: 1,
};

const safeCoordinate = (
    [workAreaPosition, workAreaSize]: [number, number],
    [windowPosition, windowSize]: [number, number]
) => {
    const safeSize = Math.min(workAreaSize, windowSize);
    let safePosition = windowPosition;

    if (windowPosition < workAreaPosition) {
        safePosition = workAreaPosition;
    } else if (windowPosition + windowSize > workAreaPosition + workAreaSize) {
        safePosition = workAreaPosition + workAreaSize - safeSize;
    }

    return [safePosition, safeSize];
};

const ensureWindowIsVisible = (bounds: Rectangle) => {
    const { workArea } = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();

    // Ensure the window is not larger than the work area
    const [safeX, safeWidth] = safeCoordinate([workArea.x, workArea.width], [bounds.x, bounds.width]);
    const [safeY, safeHeight] = safeCoordinate([workArea.y, workArea.height], [bounds.y, bounds.height]);

    return {
        x: safeX,
        y: safeY,
        width: safeWidth,
        height: safeHeight,
    };
};

export const getWindowConfig = (): WindowConfigProperties => {
    const windowConfig = store.get('windowConfig');

    if (!windowConfig) return DEFAULT_CONFIG;

    return {
        minHeight: DEFAULT_CONFIG.minHeight,
        minWidth: DEFAULT_CONFIG.minWidth,
        ...windowConfig,
        ...ensureWindowIsVisible(windowConfig),
    };
};

const saveWindowConfig = (browserWindow: BrowserWindow) => {
    const config: WindowConfigStoreProperties = {
        ...browserWindow.getBounds(),
        maximized: browserWindow.isMaximized(),
        zoomLevel: browserWindow.webContents.getZoomLevel(),
    };

    store.set('windowConfig', config);
};

export const registerWindowManagementHandlers = (window: BrowserWindow) => {
    const debouncedSave = debounce(() => saveWindowConfig(window), 100);

    window.on('resize', debouncedSave);
    window.on('maximize', debouncedSave);
    window.on('move', debouncedSave);
    window.on('unmaximize', debouncedSave);
    window.webContents.on('zoom-changed', debouncedSave);
};

export const hideWindow = (window: BrowserWindow) => {
    /* on macOS, `window.minimize()` does not give back focus to the previous window
     * so we use `app.hide()` instead (only available on macOS). */
    if (process.platform === 'darwin') {
        app.hide();
    } else {
        window.minimize();
    }
};
