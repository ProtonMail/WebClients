import type { Reducer } from 'redux';

import type { ClipboardStoreProperties } from '@proton/pass/lib/desktop-settings/types';
import { setDesktopSettings, syncDesktopSettings } from '@proton/pass/store/actions';

export type DesktopSettingsState = {
    clipboard: ClipboardStoreProperties;
};

const getInitialState = (): DesktopSettingsState => ({
    clipboard: {},
});

const reducer: Reducer<DesktopSettingsState> = (state = getInitialState(), action) => {
    if (setDesktopSettings.success.match(action)) return { ...state, ...action.payload };
    if (syncDesktopSettings.success.match(action)) return { ...state, ...action.payload };

    return state;
};

export default reducer;
