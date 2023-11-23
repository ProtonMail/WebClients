import { useEffect } from 'react';

import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useOnboardingMessages } from '@proton/pass/hooks/useOnboardingMessages';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { WorkerMessageWithSender } from '@proton/pass/types';
import { OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useExtensionConnectContext } from './useExtensionConnectContext';

export const useOnboardingListener = () => {
    const { setOnboardingMessage, setPendingShareAccess } = useSpotlight();
    const { context: extensionContext } = useExtensionConnectContext();
    const definitions = useOnboardingMessages();

    useEffect(() => {
        const handleMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background') {
                switch (message.type) {
                    case WorkerMessageType.UPDATE_AVAILABLE:
                        setOnboardingMessage(definitions[OnboardingMessage.UPDATE_AVAILABLE]);
                        break;
                    case WorkerMessageType.PERMISSIONS_UPDATE:
                        setOnboardingMessage(definitions[OnboardingMessage.PERMISSIONS_REQUIRED]);
                        break;
                }
            }
        };

        void sendMessage.onSuccess(
            popupMessage({ type: WorkerMessageType.ONBOARDING_REQUEST }),
            async ({ message }) => {
                await wait(200);
                if (message === OnboardingMessage.PENDING_SHARE_ACCESS) setPendingShareAccess(true);
                else setOnboardingMessage(message ? definitions[message] ?? null : null);
            }
        );

        extensionContext?.port.onMessage.addListener(handleMessage);
        return () => extensionContext?.port.onMessage.removeListener(handleMessage);
    }, [extensionContext]);
};
