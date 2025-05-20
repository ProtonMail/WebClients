import type { OnTelemetryEvent } from '@proton/pass/components/Core/PassCoreProvider';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const sendTelemetryEvent: OnTelemetryEvent = (Event, Values, Dimensions, platform, extra) =>
    sendMessage(
        contentScriptMessage({
            type: WorkerMessageType.TELEMETRY_EVENT,
            payload: { event: createTelemetryEvent(Event, Values, Dimensions, platform), extra },
        })
    ).catch(noop);
