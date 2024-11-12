import { setDesktopSettings, syncDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

const set = createRequestSaga({
    actions: setDesktopSettings,
    call: async (value, { getDesktopBridge }) => {
        const desktopBridge = getDesktopBridge?.();
        if (value.clipboard) await desktopBridge?.setClipboardConfig({ timeoutMs: value.clipboard.timeoutMs });
        return value;
    },
});

const sync = createRequestSaga({
    actions: syncDesktopSettings,
    call: async (_, { getDesktopBridge }) => {
        const desktopBridge = getDesktopBridge?.();
        const clipboard = await desktopBridge?.getClipboardConfig();
        return { clipboard };
    },
});

export default [set, sync];
