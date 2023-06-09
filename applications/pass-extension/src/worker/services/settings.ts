import type { Types } from 'webextension-polyfill';

import { backgroundMessage } from '@proton/pass/extension/message';
import { browserLocalStorage } from '@proton/pass/extension/storage';
import browser from '@proton/pass/globals/browser';
import { selectProxiedSettings } from '@proton/pass/store';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { type Maybe, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { INITIAL_SETTINGS } from '../../shared/constants';
import WorkerMessageBroker from '../channel';
import store from '../store';

type ExtensionSetting = {
    platform: 'all' | 'chrome' | 'firefox';
    defaultValue: boolean;
    set: (value: boolean) => Promise<boolean>;
    get: () => Promise<boolean>;
};

const createBrowserSetting = (id: string, setting: Types.Setting, defaultValue: boolean): ExtensionSetting => {
    return {
        platform: 'all',
        defaultValue,
        get: async () => (await setting.get({})).value,
        set: async (value: boolean): Promise<boolean> => {
            try {
                const { levelOfControl } = await setting.get({});
                if (
                    levelOfControl === 'controlled_by_this_extension' ||
                    levelOfControl === 'controllable_by_this_extension'
                ) {
                    await setting.set({ value });
                    return true;
                }

                return false;
            } catch (e) {
                logger.warn(`[Worker::Settings] could not update ${id}`, e);
                return false;
            }
        },
    };
};

export type SettingsService = ReturnType<typeof createSettingsService>;

export const createSettingsService = () => {
    const browserSettings: Record<string, ExtensionSetting> = {
        'autosave.browserDefault': createBrowserSetting(
            'passwordSavingEnabled',
            browser.privacy.services.passwordSavingEnabled,
            false
        ),
    };

    /* on extension install : try to set the extension's
     * browser settings to their default values. Set the initial
     * proxied locally stored settings with the results */
    const onInstall = async () => {
        await Promise.all(Object.values(browserSettings).map(({ set, defaultValue }) => set(defaultValue)));
        const initialSettings = selectProxiedSettings(store.getState());
        initialSettings.autosave.browserDefault = await browserSettings['autosave.browserDefault'].get();

        return browserLocalStorage.setItem('settings', JSON.stringify(initialSettings));
    };

    const syncBrowserSettings = async (settings: ProxiedSettings) =>
        Promise.all([browserSettings['autosave.browserDefault'].set(!settings.autosave.browserDefault)]);

    /* We have to proxy the redux store settings in local storage
     * in case the user is logged out (session invalidated, locked etc..)
     * but need to preserve the user settings in the content-script */
    const sync = async (settings: ProxiedSettings) => {
        await syncBrowserSettings(settings);
        await browserLocalStorage.setItem('settings', JSON.stringify(settings));
        logger.info('[Worker::Settings] synced settings');

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.SETTINGS_UPDATE,
                payload: settings,
            })
        );
    };

    const resolve = async (): Promise<Maybe<ProxiedSettings>> => {
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
