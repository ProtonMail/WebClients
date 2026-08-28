import { useMemo } from 'react';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import noop from '@proton/utils/noop';

import { WorkerMessageType } from '../../types/messages';
import { sendMessage } from '../message/send-message';
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
