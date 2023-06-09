import { type VFC } from 'react';

import { ApplicationLogs } from '../component/ApplicationLogs';
import { SettingsPanel } from '../component/SettingsPanel';
import { VaultsPanel } from '../component/VaultsPanel';

export const General: VFC = () => {
    return (
        <>
            <VaultsPanel />
            <SettingsPanel />
            <ApplicationLogs />
        </>
    );
};
