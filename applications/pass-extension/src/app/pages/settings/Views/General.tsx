import { type FC } from 'react';

import { ApplicationLogs } from 'proton-pass-extension/lib/components/Settings/ApplicationLogs';
import { Behaviors } from 'proton-pass-extension/lib/components/Settings/Behaviors';
import { Locale } from 'proton-pass-extension/lib/components/Settings/Locale';

export const General: FC = () => {
    return (
        <>
            <Locale />
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
