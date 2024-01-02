import type { FC } from 'react';

import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { SessionLockStatus } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';

import { useAuthService } from '../../../Context/AuthServiceProvider';

export const Export: FC = () => {
    const authService = useAuthService();

    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter
                onConfirm={async (password) => {
                    const check = await authService.confirmPassword(password);
                    if (!check) throwError({ message: 'Session not confirmed' });

                    const { status } = await authService.checkLock();
                    if (status === SessionLockStatus.LOCKED) throwError({ message: 'Session is locked' });
                }}
            />
        </SettingsPanel>
    );
};
