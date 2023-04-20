import { type VFC } from 'react';

import { ApplicationLogs } from '../component/ApplicationLogs';
import { SettingsPanel } from '../component/SettingsPanel';

export const General: VFC = () => {
    return (
        <>
            <SettingsPanel />
            <ApplicationLogs />
        </>
    );
};
