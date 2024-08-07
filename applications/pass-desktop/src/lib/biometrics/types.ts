export type BiometricsPlatformHandler = {
    canCheckPresence: () => Promise<boolean>;
    checkPresence: (e: Electron.IpcMainInvokeEvent, reason: string) => Promise<boolean>;
    getDecryptionKey: (e: Electron.IpcMainInvokeEvent, challenge: string) => Promise<string[] | null>;
    getSecret: (e: Electron.IpcMainInvokeEvent, key: string) => Promise<string | null>;
    setSecret: (e: Electron.IpcMainInvokeEvent, key: string, secret: string) => Promise<void>;
    deleteSecret: (e: Electron.IpcMainInvokeEvent, key: string) => Promise<void>;
};
