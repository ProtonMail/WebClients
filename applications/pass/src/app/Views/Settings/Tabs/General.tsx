import { type FC } from 'react';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Beta } from '@proton/pass/components/Settings/Beta';
import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { Offline } from '@proton/pass/components/Settings/Offline';
import { Theme } from '@proton/pass/components/Settings/Theme';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useOfflineSupported } from '@proton/pass/hooks/useOfflineSupported';
import { PassFeature } from '@proton/pass/types/api/features';
import isTruthy from '@proton/utils/isTruthy';

export const General: FC = () => {
    /** Limit beta enabling to the cohort having the `PassWebInternalAlpha`
     * flag for now. FIXME: remove this when leveraging the user settings */
    const canEnableBeta = useFeatureFlag(PassFeature.PassWebInternalAlpha) && BUILD_TARGET === 'web';
    const offlineSupported = useOfflineSupported();

    return [
        canEnableBeta && <Beta key="beta-access" />,
        <Locale key="locale" />,
        <Theme key="theme" />,
        <Display key="display" />,
        offlineSupported && <Offline key="offline" />,
        <ApplicationLogs style={{ '--h-custom': '18.75rem' }} key="logs" />,
    ].filter(isTruthy);
};
