import { syncDesktopSettings } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: syncDesktopSettings,
    call: async (_, { getDesktopBridge }) => {
        const desktopBridge = getDesktopBridge?.();
        const clipboard = (await desktopBridge?.getClipboardConfig()) || {};
        return { clipboard };
    },
});
