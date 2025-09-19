import { path } from '@tauri-apps/api';
import { openPath, openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';
import { commands } from 'proton-authenticator/lib/tauri/commands';
import { checkForUpdates, updateTo } from 'proton-authenticator/lib/tauri/update';

import type { MaybeNull } from '@proton/pass/types/utils';
import noop from '@proton/utils/noop';

const getTheme = (): Promise<MaybeNull<string>> => commands.getTheme().catch(() => null);
const setTheme = (theme: string): Promise<void> => commands.setTheme(theme).then(noop).catch(noop);

const openLogs = async () => openPath(await path.appLogDir());
const openUrl = (url: string) => tauriOpenUrl(url);

export default {
    getTheme,
    setTheme,
    openLogs,
    openUrl,
    checkForUpdates,
    updateTo,
};
