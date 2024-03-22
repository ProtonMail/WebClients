import type { FC } from 'react';

import { SettingsPanel } from 'proton-pass-extension/lib/components/Settings/SettingsPanel';
import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { pageMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { SessionLockStatus, WorkerMessageType } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';

const checkLock = async () => {
    const result = await sendMessage(
        pageMessage({
            type: WorkerMessageType.AUTH_CHECK,
            payload: { immediate: true },
        })
    );

    return result.type === 'success' && result.ok && result.status !== SessionLockStatus.LOCKED;
};

const confirmPassword = async (password: string) => {
    const result = await sendMessage(
        pageMessage({
            type: WorkerMessageType.AUTH_CONFIRM_PASSWORD,
            payload: { password },
        })
    );

    return result.type === 'success' && result.ok;
};

export const Export: FC = () => (
    <SettingsPanel title={c('Label').t`Export`}>
        <Exporter
            onConfirm={async (password) => {
                if (!(await confirmPassword(password))) throwError({ message: 'Session not confirmed' });
                if (!(await checkLock())) throwError({ message: 'Session is locked' });
            }}
        />
    </SettingsPanel>
);
