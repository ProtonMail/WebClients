import { contextBridge, ipcRenderer } from 'electron';

export type ContextBridgeApi = {
    writeToClipboard: (text: string) => Promise<void>;
    canCheckPresence: () => Promise<boolean>;
    checkPresence: (reason?: string) => Promise<boolean>;
    getDecryptionKey: (challenge: string) => Promise<Buffer | null>;
    getSecret: (key: string) => Promise<string>;
    setSecret: (key: string, data: string) => Promise<void>;
    deleteSecret: (key: string) => Promise<void>;
};

const contextBridgeApi: ContextBridgeApi = {
    // clipboard
    writeToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),

    // secrets
    canCheckPresence: () => ipcRenderer.invoke('biometrics:canCheckPresence'),
    checkPresence: (reason?: string) => ipcRenderer.invoke('biometrics:checkPresence', reason),
    getDecryptionKey: (challenge: string) => ipcRenderer.invoke('biometrics:getDecryptionKey', challenge),
    getSecret: (key: string) => ipcRenderer.invoke('biometrics:getSecret', key),
    setSecret: (key: string, data: string) => ipcRenderer.invoke('biometrics:setSecret', key, data),
    deleteSecret: (key: string) => ipcRenderer.invoke('biometrics:deleteSecret', key),
};

contextBridge.exposeInMainWorld('ctxBridge', contextBridgeApi);
