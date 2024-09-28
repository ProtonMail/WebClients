import { contextBridge, ipcRenderer } from 'electron';

import type { ContextBridgeApi } from '@proton/pass/types';

const contextBridgeApi: ContextBridgeApi = {
    /* clipboard */
    writeToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),

    /* routing */
    navigate: (href: string) => ipcRenderer.invoke('router:navigate', href),

    /* secrets */
    canCheckPresence: () => ipcRenderer.invoke('biometrics:canCheckPresence'),
    checkPresence: (reason?: string) => ipcRenderer.invoke('biometrics:checkPresence', reason),
    getDecryptionKey: (challenge: string) => ipcRenderer.invoke('biometrics:getDecryptionKey', challenge),
    getSecret: (key: string) => ipcRenderer.invoke('biometrics:getSecret', key),
    setSecret: (key: string, data: string) => ipcRenderer.invoke('biometrics:setSecret', key, data),
    deleteSecret: (key: string) => ipcRenderer.invoke('biometrics:deleteSecret', key),
};

contextBridge.exposeInMainWorld('ctxBridge', contextBridgeApi);
