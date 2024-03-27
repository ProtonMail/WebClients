import { isElectronApp } from '../helpers/desktop';

export const canInvokeInboxDesktopIPC =
    isElectronApp &&
    !!window.ipcInboxMessageBroker &&
    !!window.ipcInboxMessageBroker.send &&
    !!window.ipcInboxMessageBroker.getTheme;
