import { type VFC } from 'react';

import { ApplicationLogs } from '../component/ApplicationLogs';
import { Behaviors } from '../component/Behaviors';
import { Locale } from '../component/Locale';
import { PrimaryVault } from '../component/PrimaryVault';

export const General: VFC = () => {
    return (
        <>
            <Locale />
            <PrimaryVault />
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
