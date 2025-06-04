import type { IPCChannelResult, IPCChannels } from 'applications/pass-desktop/src/lib/ipc';
import { contextBridge, ipcRenderer } from 'electron';

import type { ContextBridgeApi } from '@proton/pass/types';
import { disableMouseNavigation } from '@proton/shared/lib/desktop/disableMouseNavigation';

const invoke = <T extends keyof IPCChannels, P extends IPCChannels[T]['args'], R extends IPCChannels[T]['result']>(
    method: T,
    ...args: P
): Promise<R> =>
    ipcRenderer.invoke(method, ...args).then((res: IPCChannelResult<R>) => {
        if (!res.ok) throw new Error(res.error ?? 'Unknown error');
        return res.result;
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
    getSecret: (key, version) => invoke('biometrics:getSecret', key, version),
    setSecret: (key, data) => invoke('biometrics:setSecret', key, data),
    deleteSecret: (key) => invoke('biometrics:deleteSecret', key),

    /* install info */
    getInstallInfo: () => invoke('installInfo:getInfo'),
    setInstallSourceReported: () => invoke('installInfo:setInstallSourceReported'),

    /* autotype fields */
    autotype: (props) => invoke('autotype:execute', props),
};

contextBridge.exposeInMainWorld('ctxBridge', contextBridgeApi);
disableMouseNavigation();
