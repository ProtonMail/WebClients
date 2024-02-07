import { type FC } from 'react';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';

export const General: FC = () => [<Locale />, <Display />, <ApplicationLogs style={{ '--h-custom': '18.75rem' }} />];
