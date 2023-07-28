import { backgroundMessage } from '@proton/pass/extension/message';
import { browserLocalStorage } from '@proton/pass/extension/storage';
import { selectProxiedSettings } from '@proton/pass/store';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { INITIAL_SETTINGS } from '../../shared/constants';
import WorkerMessageBroker from '../channel';
import store from '../store';

export type SettingsService = ReturnType<typeof createSettingsService>;

export const createSettingsService = () => {
    /* on extension install : Set the initial proxied
     * locally stored settings with the results */
    const onInstall = async () => {
        const initialSettings = selectProxiedSettings(store.getState());
        return browserLocalStorage.setItem('settings', JSON.stringify(initialSettings));
    };

    /* We have to proxy the redux store settings in local storage
     * in case the user is logged out (session invalidated, locked etc..)
     * but need to preserve the user settings in the content-script */
    const sync = async (settings: ProxiedSettings) => {
        await browserLocalStorage.setItem('settings', JSON.stringify(settings));
        logger.info('[Worker::Settings] synced settings');

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.SETTINGS_UPDATE,
                payload: settings,
            })
        );
    };

    const resolve = async (): Promise<ProxiedSettings> => {
        try {
            const settings = await browserLocalStorage.getItem('settings');
            if (!settings) throw new Error();

            return JSON.parse(settings);
        } catch (e) {
            return INITIAL_SETTINGS;
        }
    };

    return { onInstall, sync, resolve };
};
