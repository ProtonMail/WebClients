import { themeOptionToDesktop } from '@proton/pass/components/Layout/Theme/types';
import { setDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const set = createRequestSaga({
    actions: setDesktopSettings,
    call: async (value, { getDesktopBridge }) => {
        try {
            const desktopBridge = getDesktopBridge?.();
            if (value.clipboard?.timeoutMs !== undefined)
                {await desktopBridge?.setClipboardConfig({ timeoutMs: value.clipboard.timeoutMs });}
            if (value.theme !== undefined) await desktopBridge?.setTheme(themeOptionToDesktop[value.theme]);
            return true;
        } catch (err) {
            return false;
        }
    },
});

export default [set];
