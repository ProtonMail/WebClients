import Logger from "electron-log";
/* eslint-disable-next-line inbox-desktop/no-direct-electron-store-access */
import Store from "electron-store";

const storeLogger = Logger.scope("store");

const safeDeserialize = (storeAlias: string, storeFileName: string) => (text: string) => {
    try {
        return JSON.parse(text);
    } catch (error) {
        storeLogger.error(
            `Corrupted store "${storeAlias}" detected in file "${storeFileName}", resetting to defaults`,
            {
                error: error instanceof Error ? error.message : String(error),
                snippet: typeof text === "string" ? text.substring(0, 100) : typeof text,
            },
        );
        throw error;
    }
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export class SafeStore<T extends Record<string, any> = Record<string, unknown>> extends Store<T> {
    constructor(
        storeNameIdentifier: string,
        options?: Omit<Store.Options<T>, "deserialize" | "clearInvalidConfig" | "configFileMode">,
    ) {
        super({
            ...options,
            configFileMode: 0o600,
            clearInvalidConfig: true,
            deserialize: safeDeserialize(storeNameIdentifier, options?.name ?? "config"),
        });
    }
}
