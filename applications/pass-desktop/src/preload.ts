import { contextBridge, ipcRenderer } from 'electron';

export type ContextBridgeApi = {
    writeToClipboard: (text: string) => Promise<void>;
};

const contextBridgeApi: ContextBridgeApi = {
    writeToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
};

contextBridge.exposeInMainWorld('ctxBridge', contextBridgeApi);
