import { useFlag } from '@protontech/proxy-client-react';

import {
    isElectronApp,
    isElectronOnMac as testIsElectronOnMac,
    isElectronOnWindows as testIsElectronOnWindows,
} from '@proton/shared/lib/helpers/desktop';

const useIsElectronApp = (flag: string) => {
    const isElectron = isElectronApp();
    const electronFlag = useFlag(flag);
    const isElectronDisabled = isElectron && electronFlag;
    const isElectronOnMac = testIsElectronOnMac();
    const isElectronOnWindows = testIsElectronOnWindows();

    return { isElectron, isElectronDisabled, isElectronOnMac, isElectronOnWindows };
};

export default useIsElectronApp;
