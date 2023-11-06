import { Rectangle, screen } from "electron";
import Store from "electron-store";
import { APP, DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH, STORE_WINDOW_KEY } from "./constants";

const store = new Store();

const storeKey = (app: APP) => `${STORE_WINDOW_KEY}-${app}`;

const getWindowSize = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = Math.round(width * 0.95);
    const windowHeight = Math.round(height * 0.9);

    return {
        height: DEFAULT_WINDOW_HEIGHT > height ? windowHeight : DEFAULT_WINDOW_HEIGHT,
        width: DEFAULT_WINDOW_WIDTH > width ? windowWidth : DEFAULT_WINDOW_WIDTH,
    };
};

const getWindowsPosition = () => {
    const { width, height, x, y } = screen.getPrimaryDisplay().workArea;
    // Centers the windows with a bit of a random offset to avoid overlapping windows
    return {
        x: Math.round((width - DEFAULT_WINDOW_WIDTH) / 2 + x + x * Math.random() + 10),
        y: Math.round((height - DEFAULT_WINDOW_HEIGHT) / 2 + y + y * Math.random() + 10),
    };
};

export const getWindowState = (app: APP): Rectangle => {
    const storedData = store.get(storeKey(app));
    if (storedData) {
        return storedData as Rectangle;
    }

    const { width, height } = getWindowSize();
    const { x, y } = getWindowsPosition();
    return {
        x,
        y,
        width,
        height,
    };
};

export const setWindowState = (state: Rectangle, app: APP): void => {
    store.set(storeKey(app), state);
};
