import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useExtensionConnect } from 'proton-pass-extension/lib/components/Extension/ExtensionConnect';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useOnboardingMessages } from '@proton/pass/hooks/useOnboardingMessages';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { selectCreatedItemsCount } from '@proton/pass/store/selectors';
import type { WorkerMessageWithSender } from '@proton/pass/types';
import { OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export const useOnboardingListener = () => {
    const { onboardingCheck } = usePassCore();
    const { setOnboardingMessage, setPendingShareAccess } = useSpotlight();
    const { context: extensionContext } = useExtensionConnect();
    const createdItemsCount = useSelector(selectCreatedItemsCount);
    const definitions = useOnboardingMessages();

    useEffect(() => {
        const handleMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background') {
                switch (message.type) {
                    case WorkerMessageType.UPDATE_AVAILABLE:
                        setOnboardingMessage(definitions[OnboardingMessage.UPDATE_AVAILABLE] ?? null);
                        break;
                    case WorkerMessageType.PERMISSIONS_UPDATE:
                        setOnboardingMessage(definitions[OnboardingMessage.PERMISSIONS_REQUIRED] ?? null);
                        break;
                }
            }
        };

        void sendMessage.onSuccess(
            popupMessage({ type: WorkerMessageType.ONBOARDING_REQUEST }),
            async ({ message }) => {
                await wait(200);
                if (message === OnboardingMessage.PENDING_SHARE_ACCESS) setPendingShareAccess(true);

                setOnboardingMessage(message ? (definitions[message] ?? null) : null);
            }
        );

        extensionContext?.port.onMessage.addListener(handleMessage);
        return () => extensionContext?.port.onMessage.removeListener(handleMessage);
    }, [extensionContext]);

    useEffect(() => {
        const check = async () => (await onboardingCheck?.(OnboardingMessage.USER_RATING)) ?? false;

        check()
            .then((enabled) => enabled && setOnboardingMessage(definitions[OnboardingMessage.USER_RATING] ?? null))
            .catch(noop);
    }, [createdItemsCount]);
};
