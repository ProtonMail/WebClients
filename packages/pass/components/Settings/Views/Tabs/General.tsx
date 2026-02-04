import type { FC } from 'react';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Beta, useShowBeta } from '@proton/pass/components/Settings/Beta';
import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { Offline } from '@proton/pass/components/Settings/Offline';
import { Theme } from '@proton/pass/components/Settings/Theme';
import isTruthy from '@proton/utils/isTruthy';

export const General: FC = () => {
    const showBeta = useShowBeta();

    return [
        showBeta && <Beta key="beta-access" />,
        <Locale key="locale" />,
        <Theme key="theme" />,
        <Display key="display" />,
        OFFLINE_SUPPORTED && <Offline key="offline" />,
        <ApplicationLogs style={{ '--h-custom': '18.75rem' }} key="logs" />,
    ].filter(isTruthy);
};
