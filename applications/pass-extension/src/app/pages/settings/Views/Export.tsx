import { type FC, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useReauthActionHandler } from '@proton/pass/hooks/auth/useReauthActionHandler';
import { getStateKey, isReauthForkState } from '@proton/pass/lib/auth/fork';
import { pageMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import { WorkerMessageType } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';

const checkLock = async () => {
    const result = await sendMessage(
        pageMessage({
            type: WorkerMessageType.AUTH_CHECK,
            payload: { immediate: true },
        })
    );

    return result.type === 'success' && result.ok && !result.locked;
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

export const Export: FC = () => {
    const history = useHistory();
    const handleReauthAction = useReauthActionHandler();

    useEffect(() => {
        void (async () => {
            const params = new URLSearchParams(history.location.search);
            const state = params.get('state');
            if (!state) return;

            history.replace({ ...history.location, search: '' });
            const stateKey = getStateKey(state);

            const stateData = (await browser.storage.session.get(stateKey))?.[stateKey];
            await browser.storage.session.remove([stateKey]);

            if (typeof stateData !== 'string') return;
            const data = JSON.parse(stateData);

            if (isReauthForkState(data)) return handleReauthAction(data.reauth);
        })();
    }, []);

    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter
                onConfirm={async (password) => {
                    if (!(await confirmPassword(password))) throwError({ message: 'Session not confirmed' });
                    if (!(await checkLock())) throwError({ message: 'Session is locked' });
                }}
            />
        </SettingsPanel>
    );
};
