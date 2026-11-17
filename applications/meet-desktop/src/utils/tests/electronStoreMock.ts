import type { Mock } from "vitest";
import Store from "electron-store";
import { SettingsStore } from "../../store/settingsStore";

interface Singleton<T> {
    INSTANCE: T;
}

vi.mock("electron-store", () => ({
    default: getSingleton<(typeof MockedStore)["INSTANCE"]>(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    })),
}));

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
    get: Mock<() => SettingsStore>;
    set: () => void;
    delete: () => void;
}>;
