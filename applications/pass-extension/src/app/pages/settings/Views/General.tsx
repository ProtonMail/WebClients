import { type FC } from 'react';

import { Behaviors } from 'proton-pass-extension/lib/components/Settings/Behaviors';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Locale } from '@proton/pass/components/Settings/Locale';
import { Theme } from '@proton/pass/components/Settings/Theme';

export const General: FC = () => [
    <Locale key="locale" />,
    <Theme key="theme" />,
    <Behaviors key="behaviors" />,
    <ApplicationLogs key="logs" style={{ '--h-custom': '18.75rem' }} />,
];
