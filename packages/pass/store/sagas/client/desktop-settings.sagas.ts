import { desktopThemeToOption } from '@proton/pass/components/Layout/Theme/types';
import { setDesktopSettings, syncDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const set = createRequestSaga({
    actions: setDesktopSettings,
    call: async (value, { getDesktopBridge }) => {
        const desktopBridge = getDesktopBridge?.();
        if (value.clipboard) await desktopBridge?.setClipboardConfig(value.clipboard);
        if (value.theme) await desktopBridge?.setTheme(value.theme);

        // Convert DTO to SettingState
        return {
            clipboard: value.clipboard,
            theme: value.theme ? desktopThemeToOption[value.theme] : undefined,
        };
    },
});

const sync = createRequestSaga({
    actions: syncDesktopSettings,
    call: async (_, { getDesktopBridge }) => {
        const desktopBridge = getDesktopBridge?.();
        const clipboard = await desktopBridge?.getClipboardConfig();
        const desktopTheme = (await desktopBridge?.getTheme()) ?? 'system';

        // Convert DTO to SettingState
        return {
            clipboard,
            theme: desktopThemeToOption[desktopTheme],
        };
    },
});

export default [set, sync];
