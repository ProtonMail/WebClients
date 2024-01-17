import { type VFC } from 'react';

import { Display } from '@proton/pass/components/Settings/Display';
import { Locale } from '@proton/pass/components/Settings/Locale';

export const General: VFC = () => {
    return (
        <>
            <Locale />
            <Display />
        </>
    );
};
