import {
    SUPPORTED_ELECTRON_APP,
    isElectronApp,
    isElectronOnMac,
    isElectronOnWindows,
} from '@proton/shared/lib/helpers/desktop';
import { type FeatureFlag, useFlag } from '@proton/unleash';

import useConfig from './useConfig';

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
