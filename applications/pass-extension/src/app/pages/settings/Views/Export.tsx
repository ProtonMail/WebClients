import type { FC } from 'react';

import { pageMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { throwError } from '@proton/pass/utils/fp/throw';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';
import { serialize } from '@proton/pass/utils/object/serialize';

const checkLock = async () => {
    const result = await sendMessage(
        pageMessage({
            type: WorkerMessageType.AUTH_CHECK,
            payload: { immediate: true },
        })
    );

    return result.type === 'success' && result.ok && !result.locked;
};

const confirmPassword = async (password: XorObfuscation) => {
    const result = await sendMessage(
        pageMessage({
            type: WorkerMessageType.AUTH_CONFIRM_PASSWORD,
            payload: { password: serialize(password) },
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
