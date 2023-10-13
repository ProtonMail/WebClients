import { useEffect, useRef } from 'react';

import type { WorkerMessageWithSender } from '@proton/pass/types';
import { ShareEventType, WorkerMessageType } from '@proton/pass/types';

import { ExtensionContext } from '../context/extension-context';

type UseShareServerEventHookOptions = {
    onShareDisabled: (shareId: string) => void;
    onItemsDeleted?: (shareId: string, itemIds: string[]) => void;
};

export const useShareEventEffect = (options: UseShareServerEventHookOptions) => {
    const optionsRef = useRef<UseShareServerEventHookOptions>(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    useEffect(() => {
        const { port } = ExtensionContext.get();

        const handleShareServerEvent = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.SHARE_SERVER_EVENT) {
                const { payload } = message;

                switch (payload.type) {
                    case ShareEventType.SHARE_DISABLED:
                        return optionsRef.current.onShareDisabled(payload.shareId);
                    case ShareEventType.ITEMS_DELETED:
                        const { shareId, itemIds } = payload;
                        return optionsRef.current.onItemsDeleted?.(shareId, itemIds);
                }
            }
        };

        port.onMessage.addListener(handleShareServerEvent);
        return () => port.onMessage.removeListener(handleShareServerEvent);
    }, []);
};
