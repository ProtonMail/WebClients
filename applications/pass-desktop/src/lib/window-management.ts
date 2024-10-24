import type { BrowserWindow, BrowserWindowConstructorOptions, Rectangle } from 'electron';
import { screen } from 'electron';

import type { Optional } from '@proton/shared/lib/interfaces';
import debounce from '@proton/utils/debounce';

import { store } from '../store';

export type WindowConfigStoreProperties = {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
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
    zoom: 1,
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

export const getWindowConfig = (): BrowserWindowConstructorOptions => {
    const windowConfig = store.get('windowConfig');

    if (!windowConfig) return DEFAULT_CONFIG;

    return {
        ...windowConfig,
        ...ensureWindowIsVisible(windowConfig),
    };
};

const saveWindowConfig = (browserWindow: BrowserWindow) => {
    const config: WindowConfigStoreProperties = {
        ...browserWindow.getBounds(),
        maximized: browserWindow.isMaximized(),
        zoom: browserWindow.webContents.getZoomFactor(),
    };

    store.set('windowConfig', config);
};

export const registerWindowManagementHandlers = (window: BrowserWindow) => {
    const debouncedSave = debounce(() => saveWindowConfig(window), 1_000);

    window.on('resize', debouncedSave);
    window.on('maximize', debouncedSave);
    window.on('move', debouncedSave);
    window.on('unmaximize', debouncedSave);
    window.webContents.on('zoom-changed', debouncedSave);
    window.on('close', () => saveWindowConfig(window));
};
