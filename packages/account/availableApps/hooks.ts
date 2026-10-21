import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import { selectAvailableApps } from './index';

/**
 * The apps the user can switch to, in app switcher order. None until they're first computed.
 * They're computed at bootstrap, and refreshed with fetchAvailableApps.
 */
export const useAvailableApps = () => useSelector(selectAvailableApps);
