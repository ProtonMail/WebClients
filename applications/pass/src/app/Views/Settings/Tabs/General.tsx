import { type FC } from 'react';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Beta } from '@proton/pass/components/Settings/Beta';
import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';
import isTruthy from '@proton/utils/isTruthy';

export const General: FC = () => {
    /** Limit beta enabling to the cohort having the `PassWebInternalAlpha`
     * flag for now. FIXME: remove this when leveraging the user settings */
    const canEnableBeta = useFeatureFlag(PassFeature.PassWebInternalAlpha) && BUILD_TARGET === 'web';

    return [
        canEnableBeta && <Beta key="beta-access" />,
        <Locale key="locale" />,
        <Display key="display" />,
        <ApplicationLogs style={{ '--h-custom': '18.75rem' }} key="logs" />,
    ].filter(isTruthy);
};
