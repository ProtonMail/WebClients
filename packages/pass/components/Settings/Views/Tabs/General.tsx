import type { FC } from 'react';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { Offline } from '@proton/pass/components/Settings/Offline';
import { Theme } from '@proton/pass/components/Settings/Theme';
import { Beta } from '@proton/pass/components/Settings/Update/Beta.web';
import { Update } from '@proton/pass/components/Settings/Update/Update.desktop';
import isTruthy from '@proton/utils/isTruthy';

export const General: FC = () => {
    return [
        BUILD_TARGET === 'web' && <Beta key="web-beta" />,
        DESKTOP_BUILD && BUILD_TARGET !== 'linux' && <Update key="desktop-update" />,
        <Locale key="locale" />,
        <Theme key="theme" />,
        <Display key="display" />,
        OFFLINE_SUPPORTED && <Offline key="offline" />,
        <ApplicationLogs style={{ '--h-custom': '18.75rem' }} key="logs" />,
    ].filter(isTruthy);
};
