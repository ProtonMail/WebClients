import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp, isElectronOnMac, isElectronOnWindows } from '@proton/shared/lib/helpers/desktop';
import { type FeatureFlag, useFlag } from '@proton/unleash';

import useConfig from './useConfig';

export const SUPPORTED_ELECTRON_APP: APP_NAMES[] = [APPS.PROTONACCOUNT, APPS.PROTONCALENDAR, APPS.PROTONMAIL];

const useIsElectronApp = (flag: FeatureFlag) => {
    const { APP_NAME } = useConfig();

    const electronFlag = useFlag(flag);
    const isElectronDisabled = isElectronApp && electronFlag;
    const isSupportedElectronApp = SUPPORTED_ELECTRON_APP.includes(APP_NAME);

    return {
        isElectron: isElectronApp,
        isElectronDisabled,
        isElectronEnabled: !isElectronDisabled,
        isElectronOnMac: isElectronOnMac,
        isElectronOnWindows: isElectronOnWindows,
        isSupportedElectronApp,
    };
};

export default useIsElectronApp;
