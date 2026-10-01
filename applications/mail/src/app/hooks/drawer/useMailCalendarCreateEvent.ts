import { useEffect } from 'react';

import { useApi } from '@proton/app-context/useApi';
import {
    TelemetryMailCalendarCreateEventEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { getIsDrawerPostMessage, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { getCreateEventFromMessagePayload } from '../../helpers/calendar/createEventFromMessage';
import { selectDraggedMessageID } from '../../store/layout/layoutSliceSelectors';
import { useMailStore } from '../../store/hooks';

/**
 * Listens for a Calendar drop handshake and turns it into a typed
 * "create event from mail" request to the Calendar drawer.
 *
 * The actual dragged message is resolved here, only after Calendar reports a
 * valid drop (`CALENDAR_MAIL_DROP`), and only its minimal metadata (subject,
 * sender) is forwarded. No message body or content is ever sent.
 */
const useMailCalendarCreateEvent = () => {
    const store = useMailStore();
    const api = useApi();

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            if (event.data.type !== DRAWER_EVENTS.CALENDAR_MAIL_DROP) {
                return;
            }

            const { start } = event.data.payload;
            const state = store.getState();

            // Resolve the single dragged message, if any. `draggedMessageID` is
            // only set by useListSelection when exactly one message is dragged.
            const messageID = selectDraggedMessageID(state);
            if (!messageID) {
                return;
            }

            const message = state.messages[messageID];
            const payload = getCreateEventFromMessagePayload(message?.data, start);
            if (!payload) {
                return;
            }

            postMessageToIframe(
                {
                    type: DRAWER_EVENTS.CALENDAR_CREATE_EVENT_FROM_MAIL,
                    payload,
                },
                APPS.PROTONCALENDAR
            );

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.mailCalendarCreateEvent,
                event: TelemetryMailCalendarCreateEventEvents.create_event,
                silence: true,
                dimensions: { entry_point: 'drag_drop' },
            });
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [store, api]);
};

export default useMailCalendarCreateEvent;
