import { type VFC } from 'react';

import { ApplicationLogs } from '../component/ApplicationLogs';
import { Behaviors } from '../component/Behaviors';
import { PrimaryVault } from '../component/PrimaryVault';

export const General: VFC = () => {
    return (
        <>
            <PrimaryVault />
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
