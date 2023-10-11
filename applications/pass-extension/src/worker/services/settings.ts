import { backgroundMessage } from '@proton/pass/lib/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { INITIAL_SETTINGS } from '../../shared/constants';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

export type SettingsService = ReturnType<typeof createSettingsService>;

export const createSettingsService = () => {
    /* We have to proxy the redux store settings in local storage
     * in case the user is logged out (session invalidated, locked etc..)
     * but need to preserve the user settings in the content-script */
    const sync = withContext<(settings: ProxiedSettings) => Promise<void>>(async ({ service }, settings) => {
        await service.i18n.setLocale(settings.locale).catch(noop);
        await service.storage.local.set({ settings: JSON.stringify(settings) });

        logger.info('[Worker::Settings] synced settings');

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.SETTINGS_UPDATE,
                payload: settings,
            })
        );
    });

    const resolve = withContext<() => Promise<ProxiedSettings>>(async ({ service }) => {
        try {
            const { settings } = await service.storage.local.get(['settings']);
            if (!settings) throw new Error();

            return JSON.parse(settings);
        } catch (e) {
            return INITIAL_SETTINGS;
        }
    });

    /* on extension install : Set the initial proxied
     * locally stored settings with the results */
    const onInstall = withContext<() => Promise<void>>(async ({ service }) => {
        const initialSettings = selectProxiedSettings(store.getState());
        return service.storage.local.set({ settings: JSON.stringify(initialSettings) });
    });

    return { onInstall, sync, resolve };
};
