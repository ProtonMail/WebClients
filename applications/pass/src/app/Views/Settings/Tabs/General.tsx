import { type FC } from 'react';

import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';

export const General: FC = () => (
    <>
        <Locale />
        <Display />
    </>
);
