import type { FC } from 'react';

import { Behaviors } from 'proton-pass-extension/lib/components/Settings/Behaviors';
import { Shortcuts } from 'proton-pass-extension/lib/components/Settings/Shortcuts';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { Offline } from '@proton/pass/components/Settings/Offline';
import { Theme } from '@proton/pass/components/Settings/Theme';

export const General: FC = () => [
    <Locale key="locale" />,
    <Theme key="theme" />,
    <Behaviors key="behaviors" />,
    <Offline key="offline" />,
    BUILD_TARGET !== 'safari' && <Shortcuts key="shortcuts" />,
    <ApplicationLogs key="logs" style={{ '--h-custom': '18.75rem' }} />,
];
