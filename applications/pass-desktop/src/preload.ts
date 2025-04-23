import { contextBridge, ipcRenderer } from 'electron';

import type { ContextBridgeApi } from '@proton/pass/types';
import { disableMouseNavigation } from '@proton/shared/lib/desktop/disableMouseNavigation';

// Parses setupIpcHandler responses into values or errors
const invoke = (method: string, ...args: any[]) =>
    ipcRenderer.invoke(method, ...args).then((r) => {
        if (r?.error) throw new Error(r.error.message);
        return r?.result;
    });

const contextBridgeApi: ContextBridgeApi = {
    /* clipboard */
    writeToClipboard: (text) => invoke('clipboard:writeText', text),
    setClipboardConfig: (config) => invoke('clipboard:setConfig', config),
    getClipboardConfig: () => invoke('clipboard:getConfig'),

    /* theming */
    getTheme: () => invoke('theming:getTheme'),
    setTheme: (theme) => invoke('theming:setTheme', theme),

    /* routing */
    navigate: (href) => invoke('router:navigate', href),

    /* secrets */
    canCheckPresence: () => invoke('biometrics:canCheckPresence'),
    checkPresence: (reason) => invoke('biometrics:checkPresence', reason),
    getDecryptionKey: (challenge) => invoke('biometrics:getDecryptionKey', challenge),
    getSecret: (key, version) => invoke('biometrics:getSecret', key, version),
    setSecret: (key, data) => invoke('biometrics:setSecret', key, data),
    deleteSecret: (key) => invoke('biometrics:deleteSecret', key),

    /* install info */
    getInstallInfo: () => invoke('installInfo:getInfo'),
    setInstallSourceReported: () => invoke('installInfo:setInstallSourceReported'),
};

contextBridge.exposeInMainWorld('ctxBridge', contextBridgeApi);
disableMouseNavigation();
