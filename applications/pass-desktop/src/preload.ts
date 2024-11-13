import { contextBridge, ipcRenderer } from 'electron';

import type { ContextBridgeApi } from '@proton/pass/types';

const contextBridgeApi: ContextBridgeApi = {
    /* clipboard */
    writeToClipboard: (text) => ipcRenderer.invoke('clipboard:writeText', text),
    setClipboardConfig: (config) => ipcRenderer.invoke('clipboard:setConfig', config),
    getClipboardConfig: () => ipcRenderer.invoke('clipboard:getConfig'),

    /* routing */
    navigate: (href) => ipcRenderer.invoke('router:navigate', href),

    /* secrets */
    canCheckPresence: () => ipcRenderer.invoke('biometrics:canCheckPresence'),
    checkPresence: (reason) => ipcRenderer.invoke('biometrics:checkPresence', reason),
    getDecryptionKey: (challenge) => ipcRenderer.invoke('biometrics:getDecryptionKey', challenge),
    getSecret: (key, version) => ipcRenderer.invoke('biometrics:getSecret', key, version),
    setSecret: (key, data) => ipcRenderer.invoke('biometrics:setSecret', key, data),
    deleteSecret: (key) => ipcRenderer.invoke('biometrics:deleteSecret', key),

    /* install info */
    getInstallInfo: () => ipcRenderer.invoke('installInfo:getInfo'),
    setInstallSourceReported: () => ipcRenderer.invoke('installInfo:setInstallSourceReported'),
};

contextBridge.exposeInMainWorld('ctxBridge', contextBridgeApi);

/** Block browser navigation using mouse buttons in Electron applications.
 * While Electron disables keyboard navigation shortcuts by default,
 * mouse navigation buttons still need to be explicitly blocked.
 * - 3: Back button (browser navigation backwards)
 * - 4: Forward button (browser navigation forwards) */
window.addEventListener(
    'mouseup',
    (evt) => {
        if (evt.button === 3 || evt.button === 4) {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        }
    },
    true
);
