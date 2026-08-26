import type { FC } from 'react';

import isTruthy from '@proton/utils/isTruthy';

import { useFeatureFlag } from '../../../../hooks/useFeatureFlag';
import { PassFeature } from '../../../../types/api/features';
import { ApplicationLogs } from '../../ApplicationLogs';
import { Display } from '../../Display';
import { Locale } from '../../Locale';
import { Offline } from '../../Offline';
import { SshAgent } from '../../SshAgent/SshAgent';
import { Theme } from '../../Theme';
import { Beta } from '../../Update/Beta.web';
import { Update } from '../../Update/Update.desktop';

export const General: FC = () => {
    const showSshAgent = useFeatureFlag(PassFeature.PassDesktopSSHAgent);

    return [
        BUILD_TARGET === 'web' && <Beta key="web-beta" />,
        DESKTOP_BUILD && BUILD_TARGET !== 'linux' && <Update key="desktop-update" />,
        <Locale key="locale" />,
        <Theme key="theme" />,
        <Display key="display" />,
        OFFLINE_SUPPORTED && <Offline key="offline" />,
        showSshAgent && <SshAgent key="ssh-agent" />,
        <ApplicationLogs style={{ '--h-custom': '18.75rem' }} key="logs" />,
    ].filter(isTruthy);
};
