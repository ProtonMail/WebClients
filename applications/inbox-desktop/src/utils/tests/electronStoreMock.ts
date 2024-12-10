import Store from "electron-store";
import { WindowBounds } from "../../store/boundsStore";
import { SettingsStore } from "../../store/settingsStore";

interface Singleton<T> {
    INSTANCE: T;
}

jest.mock("electron-store", () =>
    getSingleton<(typeof MockedStore)["INSTANCE"]>(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
);

function getSingleton<T extends Record<string, unknown>>(getInstance: () => T) {
    return class SingletonImpl {
        static INSTANCE: T;

        constructor() {
            if (SingletonImpl.INSTANCE) {
                return SingletonImpl.INSTANCE;
            }

            SingletonImpl.INSTANCE = getInstance();
            return SingletonImpl.INSTANCE;
        }
    };
}

export const MockedStore = Store as unknown as Singleton<{
    get: jest.MockedFn<() => SettingsStore | WindowBounds>;
    set: () => void;
    delete: () => void;
}>;
