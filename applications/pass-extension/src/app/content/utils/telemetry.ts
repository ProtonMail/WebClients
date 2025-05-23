import type { MessageWithSenderFactory } from '@proton/pass/lib/extension/message/send-message';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { WorkerMessageType } from '@proton/pass/types';
import type { OnTelemetryEvent } from '@proton/pass/types/data/telemetry';
import noop from '@proton/utils/noop';

export const sendTelemetryEvent =
    (messageFactory: MessageWithSenderFactory): OnTelemetryEvent =>
    (Event, Values, Dimensions, platform, extra) =>
        sendMessage(
            messageFactory({
                type: WorkerMessageType.TELEMETRY_EVENT,
                payload: { event: createTelemetryEvent(Event, Values, Dimensions, platform), extra },
            })
        ).catch(noop);

export const sendContentScriptTelemetry = sendTelemetryEvent(contentScriptMessage);
