import type { FC } from 'react';

import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { SessionLockStatus } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { useAuthService } from '../../../Context/AuthServiceProvider';

export const Export: FC = () => {
    const authService = useAuthService();

    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter
                assert={async () => {
                    const lock = await authService.checkLock();
                    if (lock.status === SessionLockStatus.LOCKED) {
                        throw Error(c('Error').t`Your ${PASS_APP_NAME} session is locked`);
                    }
                }}
            />
        </SettingsPanel>
    );
};
