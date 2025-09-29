import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { useRequestHostPermissions } from 'proton-pass-extension/lib/hooks/useHostPermissions';
import { popupMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useSpotlightMessages } from '@proton/pass/hooks/useSpotlightMessages';
import { selectCreatedItemsCount } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

const useExtensionSpotlightMessages = () => {
    const requestHostPermissions = useRequestHostPermissions();
    return useMemo(
        (): SpotlightMessageDefinition[] => [
            {
                type: SpotlightMessage.PERMISSIONS_REQUIRED,
                mode: 'default',
                id: 'permissions',
                title: c('Title').t`Grant permissions`,
                message: c('Info')
                    .t`In order to get the best experience out of ${PASS_APP_NAME}, please grant the necessary extension permissions`,
                className: SubTheme.ORANGE,
                action: {
                    label: c('Label').t`Grant`,
                    type: 'button',
                    onClick: () => requestHostPermissions(),
                },
            },
        ],
        [requestHostPermissions]
    );
};

export const useSpotlightListener = () => {
    const core = usePassCore();
    const { setSpotlight, setPendingShareAccess } = useSpotlight();
    const { port } = useExtensionContext();
    const createdItemsCount = useSelector(selectCreatedItemsCount);
    const extraDefinitions = useExtensionSpotlightMessages();
    const definitions = useSpotlightMessages(extraDefinitions);

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
