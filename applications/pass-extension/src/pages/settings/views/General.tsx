import { type VFC } from 'react';

import { ApplicationLogs } from '../component/ApplicationLogs';
import { PrimaryVaultSelect } from '../component/PrimaryVaultSelect';
import { SettingsPanel } from '../component/SettingsPanel';

export const General: VFC = () => {
    return (
        <>
            <SettingsPanel />
            <PrimaryVaultSelect />
            <ApplicationLogs />
        </>
    );
};
