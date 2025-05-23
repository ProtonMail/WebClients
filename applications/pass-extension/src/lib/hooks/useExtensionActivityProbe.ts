import { useMemo } from 'react';

import { sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import noop from '@proton/utils/noop';

import { useEndpointMessage } from './useEndpointMessage';

export const useExtensionActivityProbe = () => {
    const probe = useActivityProbe();
    const message = useEndpointMessage();

    return useMemo(
        () => ({
            start: () =>
                probe.start(() => {
                    if (AppStateManager.getState().authorized) {
                        sendMessage(
                            message({
                                type: WorkerMessageType.AUTH_CHECK,
                                payload: { immediate: false },
                            })
                        ).catch(noop);
                    }
                }, 5_000),
            cancel: probe.cancel,
        }),
        []
    );
};
