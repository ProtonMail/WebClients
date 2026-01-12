import type { FC } from 'react';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { throwError } from '@proton/pass/utils/fp/throw';

export const Export: FC = () => {
    const authService = useAuthService();

    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter
                onConfirm={async (password) => {
                    const check = await authService.confirmPassword(password);
                    if (!check) throwError({ message: 'Session not confirmed' });

                    const { locked } = await authService.checkLock();
                    if (locked) throwError({ message: 'Session is locked' });
                }}
            />
        </SettingsPanel>
    );
};
