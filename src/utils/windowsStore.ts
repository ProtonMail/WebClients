import { Rectangle, screen } from "electron";
import Store from "electron-store";
import { APP, STORE_WINDOW_KEY, WINDOW_SIZES } from "./constants";

const store = new Store();

const storeKey = (app: APP) => `${STORE_WINDOW_KEY}-${app}`;

const { DEFAULT_HEIGHT, DEFAULT_WIDTH, NEW_WINDOW_SHIFT } = WINDOW_SIZES;

const getWindowSize = () => {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const reducedWidth = Math.round(screenWidth * 0.9);
    const reducedHeight = Math.round(screenHeight * 0.9);

    return {
        height: screenWidth > DEFAULT_HEIGHT ? DEFAULT_HEIGHT : reducedHeight,
        width: screenHeight > DEFAULT_WIDTH ? DEFAULT_WIDTH : reducedWidth,
    };
};

const getWindowsPosition = () => {
    const { width: screenWidth, height: screenHeight, x, y } = screen.getPrimaryDisplay().workArea;
    return {
        x: Math.round((screenWidth - DEFAULT_WIDTH) / 2 + x + NEW_WINDOW_SHIFT),
        y: Math.round((screenHeight - DEFAULT_HEIGHT) / 2 + y + NEW_WINDOW_SHIFT),
    };
};

const windowWithinBounds = (state: Rectangle, bounds: Rectangle) => {
    return (
        state.x >= bounds.x &&
        state.y >= bounds.y &&
        state.x + state.width <= bounds.x + bounds.width &&
        state.y + state.height <= bounds.y + bounds.height
    );
};

const ensureWindowIsVisible = (state: Rectangle) => {
    return screen.getAllDisplays().some((display) => {
        return windowWithinBounds(state, display.bounds);
    });
};

export const getWindowState = (app: APP): Rectangle => {
    const storedData = store.get(storeKey(app));

    const { width, height } = getWindowSize();
    const { x, y } = getWindowsPosition();
    const defaultPosition = {
        x,
        y,
        width,
        height,
    };

    if (storedData) {
        const state = storedData as Rectangle;
        if (!ensureWindowIsVisible(state)) {
            return defaultPosition;
        }

        return state;
    }

    return defaultPosition;
};

export const setWindowState = (state: Rectangle, app: APP): void => {
    store.set(storeKey(app), state);
};
