import { syncDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: syncDesktopSettings,
    call: async () => {
        const clipboard = await window.ctxBridge!.getClipboardConfig();
        return { clipboard };
    },
});
