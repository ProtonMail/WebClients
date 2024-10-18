import { setDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: setDesktopSettings,
    call: async (value) => {
        if (value.clipboard) await window.ctxBridge?.setClipboardConfig({ timeoutMs: value.clipboard.timeoutMs });
        return value;
    },
});
