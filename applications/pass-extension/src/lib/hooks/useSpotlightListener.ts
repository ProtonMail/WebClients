import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { popupMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import { selectCreatedItemsCount } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export const useSpotlightListener = () => {
    const core = usePassCore();
    const { setSpotlight, setPendingShareAccess } = useSpotlight();
    const { port } = useExtensionContext();
    const createdItemsCount = useSelector(selectCreatedItemsCount);
    const definitions = useSpotlightMessages();

    useEffect(() => {
        const handleMessage = (message: unknown) => {
            if (matchExtensionMessage(message, { sender: 'background' })) {
                switch (message.type) {
                    case WorkerMessageType.UPDATE_AVAILABLE:
                        setSpotlight(definitions[SpotlightMessage.UPDATE_AVAILABLE] ?? null);
                        break;
                    case WorkerMessageType.PERMISSIONS_UPDATE:
                        if (message.payload.granted) break;
                        setSpotlight(definitions[SpotlightMessage.PERMISSIONS_REQUIRED] ?? null);
                        break;
                }
            }
        };

        void sendMessage.onSuccess(popupMessage({ type: WorkerMessageType.SPOTLIGHT_REQUEST }), async ({ message }) => {
            await wait(200);
            if (message === SpotlightMessage.PENDING_SHARE_ACCESS) setPendingShareAccess(true);
            else setSpotlight(message ? (definitions[message] ?? null) : null);
        });

        port.onMessage.addListener(handleMessage);
        return () => port.onMessage.removeListener(handleMessage);
    }, [port]);

    useEffect(() => {
        const check = async () => (await core.spotlight.check(SpotlightMessage.USER_RATING)) ?? false;

        check()
            .then((enabled) => enabled && setSpotlight(definitions[SpotlightMessage.USER_RATING] ?? null))
            .catch(noop);
    }, [createdItemsCount]);
};
