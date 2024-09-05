import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';

export const sendTelemetryEvent = (event: TelemetryEvent) => {
    void sendMessage(
        contentScriptMessage({
            type: WorkerMessageType.TELEMETRY_EVENT,
            payload: { event },
        })
    );
};
