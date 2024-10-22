import { setDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: setDesktopSettings,
    call: async (value, { getDesktopBridge }) => {
        const desktopBridge = getDesktopBridge?.();
        if (value.clipboard) await desktopBridge?.setClipboardConfig({ timeoutMs: value.clipboard.timeoutMs });
        return value;
    },
});
