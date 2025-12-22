import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createSettingsService as createCoreSettingsService } from '@proton/pass/lib/settings/service';
import { sanitizeSettings } from '@proton/pass/lib/settings/utils';
import { updatePauseListItem } from '@proton/pass/store/actions/creators/settings';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings } from '@proton/pass/store/selectors/settings';
import { selectCanCreateItems } from '@proton/pass/store/selectors/shares';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { logger } from '@proton/pass/utils/logger';

type SettingsServiceState = { settings: MaybeNull<ProxiedSettings> };

export const createSettingsService = () => {
    /** Cache the settings to avoid constantly reading from extension
     * storage when resolving settings for content-scripts. */
    const state: SettingsServiceState = { settings: null };

    const broadcast = withContext<(settings: ProxiedSettings) => void>(({ service }, settings) => {
        const state = service.store.getState();
        const canCreateItems = selectCanCreateItems(state);

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.SETTINGS_UPDATE,
                payload: sanitizeSettings(settings, { canCreateItems }),
            })
        );
    });

    const service = createCoreSettingsService({
        clear: withContext(async ({ service }) => {
            state.settings = null;
            await service.storage.local.removeItem('settings');
        }),

        read: withContext(
            async ({ service }) =>
                (state.settings =
                    state.settings ??
                    (await (async () => {
                        const settings = await service.storage.local.getItem('settings');
                        if (!settings) throw new Error('settings not found');

                        return JSON.parse(settings);
                    })()))
        ),

        /* We have to proxy the redux store settings in local storage
         * in case the user is logged or locked out but need to preserve
         * the user settings in content-scripts (eg: autofill settings). */
        sync: withContext<(settings: ProxiedSettings) => Promise<void>>(async ({ service }, settings) => {
            logger.info('[Worker::Settings] synced settings');
            state.settings = settings;
            await service.storage.local.setItem('settings', JSON.stringify(settings));
            broadcast(settings);
        }),
    });

    /* on extension install : Set the initial proxied
     * locally stored settings with the results */
    const onInstall = withContext<() => Promise<void>>(async ({ service }) => {
        const initialSettings = selectProxiedSettings(service.store.getState());
        return service.storage.local.setItem('settings', JSON.stringify(initialSettings));
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.PAUSE_WEBSITE,
        withContext(async (ctx, { payload: { criteria, hostname } }) => {
            ctx.service.store.dispatch(updatePauseListItem({ criteria, hostname }));
            return true;
        })
    );

    return { onInstall, broadcast, ...service };
};

export type SettingsService = ReturnType<typeof createSettingsService>;
