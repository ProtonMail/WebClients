import type { FC } from 'react';

import { SshAgent } from 'proton-pass-web/app/Views/Settings/SshAgent/SshAgent';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { Offline } from '@proton/pass/components/Settings/Offline';
import { Theme } from '@proton/pass/components/Settings/Theme';
import { Beta } from '@proton/pass/components/Settings/Update/Beta.web';
import { Update } from '@proton/pass/components/Settings/Update/Update.desktop';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';
import isTruthy from '@proton/utils/isTruthy';

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
