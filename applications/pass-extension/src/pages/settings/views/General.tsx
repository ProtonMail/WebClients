import { type VFC } from 'react';

import { ApplicationLogs } from '../component/ApplicationLogs';
import { Behaviors } from '../component/Behaviors';
import { Locale } from '../component/Locale';

export const General: VFC = () => {
    return (
        <>
            {ENV === 'development' && <Locale />}
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
