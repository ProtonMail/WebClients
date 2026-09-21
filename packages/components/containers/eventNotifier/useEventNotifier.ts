import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { EventNotifier } from '@proton/shared/lib/eventNotifier/EventNotifier';
import { getEventNotifierUrl } from '@proton/shared/lib/eventNotifier/getEventNotifierUrl';
import type { EventNotifierLoopType } from '@proton/shared/lib/eventNotifier/interface';
import { getAppVersionHeaders, getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { SentryCommonInitiatives, captureInitiativeMessage, getSentryError } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import useAuthentication from '../../hooks/useAuthentication';
import useEventManager from '../../hooks/useEventManager';

/**
 * "Ping-o-matic": keeps an SSE connection open to the event notifier and calls the event loop as
 * soon as the server signals that new events are available, on top of its regular polling.
 *
 * `types` must be referentially stable, a module level constant for example.
 */
export const useEventNotifier = ({
    types,
    debug,
}: {
    types: EventNotifierLoopType[];
    debug: (message: string, ...args: unknown[]) => void;
}) => {
    const api = useApi();
    const { API_URL, APP_NAME, APP_VERSION } = useConfig();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const isPingOMaticEnabled = useFlag('PingOMatic');
    const [user] = useUser();

    useEffect(() => {
        if (!isPingOMaticEnabled) {
            return;
        }

        const eventNotifier = new EventNotifier({
            api: getSilentApi(api),
            url: getEventNotifierUrl({
                apiUrl: API_URL,
                origin: window.location.origin,
                headers: {
                    ...getUIDHeaders(authentication.UID ?? ''),
                    ...getAppVersionHeaders(getClientID(APP_NAME), APP_VERSION),
                },
            }),
            loops: types.map((Type) => ({ Type, Identifier: user.ID })),
            onPing: ({ type }) => {
                debug(`Event notifier: ping received for the ${type} event loop`);
                // Pings received while a call is in flight are coalesced by the event manager.
                void call().catch(noop);
            },
            onError: (message, error) => {
                const sentryError = getSentryError(error);

                if (sentryError) {
                    captureInitiativeMessage(SentryCommonInitiatives.EVENT_NOTIFIER, `Event notifier: ${message}`, {
                        level: 'warning',
                        extra: { error: sentryError },
                    });
                }
            },
        });

        eventNotifier.start();

        return () => {
            eventNotifier.stop();
        };
    }, [isPingOMaticEnabled, api, API_URL, APP_NAME, APP_VERSION, authentication.UID, call, types, user.ID]);
};
