import { type VFC } from 'react';

import { ApplicationLogs } from 'proton-pass-extension/lib/components/Settings/ApplicationLogs';
import { Behaviors } from 'proton-pass-extension/lib/components/Settings/Behaviors';
import { Locale } from 'proton-pass-extension/lib/components/Settings/Locale';

export const General: VFC = () => {
    return (
        <>
            <Locale />
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
