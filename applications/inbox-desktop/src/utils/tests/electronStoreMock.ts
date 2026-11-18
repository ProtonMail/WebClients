import type { MockedFunction } from "vitest";
import { WindowBounds } from "../../store/boundsStore";
import { SafeStore } from "../../store/safeStore/safeStore";
import { SettingsStore } from "../../store/settingsStore";

interface Singleton<T> {
    INSTANCE: T;
}

vi.mock("../../store/safeStore/safeStore", () => ({
    SafeStore: getSingleton<(typeof MockedStore)["INSTANCE"]>(() => ({
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

export const MockedStore = SafeStore as unknown as Singleton<{
    get: MockedFunction<() => SettingsStore | WindowBounds>;
    set: () => void;
    delete: () => void;
}>;
