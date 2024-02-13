import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context';
import store from 'proton-pass-extension/app/worker/store';

import { backgroundMessage } from '@proton/pass/lib/extension/message';
import { createSettingsService as createCoreSettingsService } from '@proton/pass/lib/settings/service';
import { updatePauseListItem } from '@proton/pass/store/actions';
import { type ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';

export const createSettingsService = () => {
    const service = createCoreSettingsService({
        clear: withContext(({ service }) => service.storage.local.removeItem('settings')),
        resolve: withContext(async ({ service }) => {
            const settings = await service.storage.local.getItem('settings');
            if (!settings) throw new Error('settings not found');

            return JSON.parse(settings);
        }),
        /* We have to proxy the redux store settings in local storage
         * in case the user is logged out (session invalidated, locked etc..)
         * but need to preserve the user settings in the content-script */
        sync: withContext<(settings: ProxiedSettings) => Promise<void>>(async ({ service }, settings) => {
            logger.info('[Worker::Settings] synced settings');
            await service.storage.local.setItem('settings', JSON.stringify(settings));

            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.SETTINGS_UPDATE,
                    payload: settings,
                })
            );
        }),
    });

    /* on extension install : Set the initial proxied
     * locally stored settings with the results */
    const onInstall = withContext<() => Promise<void>>(async ({ service }) => {
        const initialSettings = selectProxiedSettings(store.getState());
        return service.storage.local.setItem('settings', JSON.stringify(initialSettings));
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PAUSE_WEBSITE,
        withPayload(async ({ criteria, hostname }) => {
            store.dispatch(updatePauseListItem({ criteria, hostname }));
            return true;
        })
    );

    return { onInstall, ...service };
};

export type SettingsService = ReturnType<typeof createSettingsService>;
