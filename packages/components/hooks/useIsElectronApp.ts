import { useFlag } from '@protontech/proxy-client-react';

import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import {
    isElectronApp,
    isElectronOnMac as testIsElectronOnMac,
    isElectronOnWindows as testIsElectronOnWindows,
} from '@proton/shared/lib/helpers/desktop';

import useConfig from './useConfig';

export const SUPPORTED_ELECTRON_APP: APP_NAMES[] = [APPS.PROTONACCOUNT, APPS.PROTONCALENDAR, APPS.PROTONMAIL];

const useIsElectronApp = (flag: string) => {
    const { APP_NAME } = useConfig();

    const isElectron = isElectronApp();
    const electronFlag = useFlag(flag);
    const isElectronDisabled = isElectron && electronFlag;
    const isElectronOnMac = testIsElectronOnMac();
    const isElectronOnWindows = testIsElectronOnWindows();
    const isSupportedElectronApp = SUPPORTED_ELECTRON_APP.includes(APP_NAME);

    return { isElectron, isElectronDisabled, isElectronOnMac, isElectronOnWindows, isSupportedElectronApp };
};

export default useIsElectronApp;
