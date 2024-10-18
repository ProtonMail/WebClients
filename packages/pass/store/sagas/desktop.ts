import type { PassSaga } from '@proton/pass/store/types';

import setDesktopSettings from './client/desktop-settings.set.saga';
import syncDesktopSettings from './client/desktop-settings.sync.saga';

export const DESKTOP_SAGAS: PassSaga[] = [setDesktopSettings, syncDesktopSettings];
