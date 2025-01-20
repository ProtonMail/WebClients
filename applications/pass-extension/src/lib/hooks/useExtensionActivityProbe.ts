import { useMemo } from 'react';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
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
