import { useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { parseTimeoutIntervals } from '@proton/shared/lib/eventManager/parseTimeoutIntervals';
import { EventNotifier } from '@proton/shared/lib/eventNotifier/EventNotifier';
import { getEventNotifierUrl } from '@proton/shared/lib/eventNotifier/getEventNotifierUrl';
import {
    type EventNotifierLoopType,
    EventNotifierTransport,
    MAX_EXTENDED_EVENT_LOOP_INTERVAL,
} from '@proton/shared/lib/eventNotifier/interface';
import { SentryCommonInitiatives, captureInitiativeMessage, getSentryError } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';
import noop from '@proton/utils/noop';

import useEventManager from '../../hooks/useEventManager';

/**
 * "Ping-o-matic": keeps a connection open to the event notifier and calls the event loop as soon as
 * the server signals that new events are available, on top of its regular polling. The connection
 * is held over SSE, or over WebSocket behind `PingOMaticWebSocket`.
 *
 * While pings can be received, the event loop polls at the intervals of the
 * `PingOMaticEventLoopInterval` variant payload (`{ "foreground": ms, "background": ms }`) instead
 * of the regular ones, so the interval can be ramped up per cohort while watching for missed pings.
 * Polling goes back to the regular intervals as soon as the connection can't be established or drops.
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
    const { API_URL } = useConfig();
    const eventManager = useEventManager();
    const { call } = eventManager;
    const isPingOMaticEnabled = useFlag('PingOMatic');
    const transport = useFlag('PingOMaticWebSocket') ? EventNotifierTransport.WebSocket : EventNotifierTransport.Sse;
    const extendedIntervals = parseTimeoutIntervals(
        useVariant('PingOMaticEventLoopInterval').payload?.value,
        MAX_EXTENDED_EVENT_LOOP_INTERVAL
    );
    const extendedForeground = extendedIntervals?.foreground;
    const extendedBackground = extendedIntervals?.background;
    const [user] = useUser();
    const [isPingChannelActive, setIsPingChannelActive] = useState(false);

    useEffect(() => {
        if (!isPingOMaticEnabled) {
            return;
        }

        const eventNotifier = new EventNotifier({
            api: getSilentApi(api),
            url: getEventNotifierUrl({ apiUrl: API_URL, origin: window.location.origin }),
            transport,
            loops: types.map((Type) => ({ Type, Identifier: user.ID })),
            onPing: ({ type }) => {
                debug(`Event notifier: ping received over ${transport} for the ${type} event loop`);
                // Pings received while a call is in flight are coalesced by the event manager.
                void call('Ping').catch(noop);
            },
            onPingChannelChange: (active) => {
                debug(`Event notifier: ping channel ${active ? 'active' : 'inactive'} over ${transport}`);
                setIsPingChannelActive(active);
            },
            onError: (message, error) => {
                const sentryError = getSentryError(error);

                if (sentryError) {
                    captureInitiativeMessage(SentryCommonInitiatives.EVENT_NOTIFIER, `Event notifier: ${message}`, {
                        level: 'warning',
                        extra: { error: sentryError, transport },
                    });
                }
            },
        });

        eventNotifier.start();

        return () => {
            eventNotifier.stop();
        };
    }, [isPingOMaticEnabled, transport, api, API_URL, call, types, user.ID]);

    useEffect(() => {
        if (!isPingChannelActive || extendedForeground === undefined || extendedBackground === undefined) {
            return;
        }

        eventManager.setIntervalsOverride?.({ foreground: extendedForeground, background: extendedBackground });

        return () => {
            eventManager.setIntervalsOverride?.(undefined);
        };
    }, [isPingChannelActive, extendedForeground, extendedBackground, eventManager]);
};
