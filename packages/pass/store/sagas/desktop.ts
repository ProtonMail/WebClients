import type { PassSaga } from '@proton/pass/store/types';

import desktopSettingsSagas from './client/desktop-settings.sagas';

export const DESKTOP_SAGAS: PassSaga[] = [...desktopSettingsSagas];
