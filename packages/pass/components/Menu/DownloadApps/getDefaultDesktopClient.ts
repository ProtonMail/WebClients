import { isLinux, isMac, isWindows } from '@proton/shared/lib/helpers/browser';

import { Clients } from '../../../constants';

export const getDefaultDesktopClient = (): Clients => {
    if (isMac()) return Clients.macOS;
    if (isWindows()) return Clients.Windows;
    if (isLinux()) return Clients.Linux;

    return Clients.Windows;
};
