import { type FC } from 'react';

import { c } from 'ttag';

import { LockSetup } from '@proton/pass/components/Settings/LockSetup';

import { SettingsPanel } from './SettingsPanel';

export const LockSettings: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Session locking`}>
            <LockSetup />
        </SettingsPanel>
    );
};
