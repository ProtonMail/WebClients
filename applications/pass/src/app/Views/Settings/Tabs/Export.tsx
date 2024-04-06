import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { useAuthService } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { useClient } from 'proton-pass-web/app/Context/ClientProvider';
import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { clientOffline } from '@proton/pass/lib/client';
import { selectOfflineEnabled } from '@proton/pass/store/selectors';
import { SessionLockStatus } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';

export const Export: FC = () => {
    const authService = useAuthService();
    const { status } = useClient().state;
    const offlineEnabled = useSelector(selectOfflineEnabled);
    const offline = clientOffline(status);
    const offlineConfirm = offlineEnabled && offline;

    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter
                onConfirm={async (password) => {
                    const check = await authService.confirmPassword(password, offlineConfirm);
                    if (!check) throwError({ message: 'Session not confirmed' });

                    if (!offlineConfirm) {
                        const { status } = await authService.checkLock();
                        if (status === SessionLockStatus.LOCKED) throwError({ message: 'Session is locked' });
                    }
                }}
            />
        </SettingsPanel>
    );
};
