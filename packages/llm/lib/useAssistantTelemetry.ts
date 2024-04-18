import { useApi } from '@proton/components/hooks';
import { TelemetryMailComposerAssistantEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

const useAssistantTelemetry = () => {
    const api = useApi();

    const sendShowAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.show_assistant,
        });
    };

    const sendDownloadAssistantReport = (downloadTime: number) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.download_model,
            values: {
                download_time: downloadTime,
            },
        });
    };

    const sendRequestHelpAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.request_help,
        });
    };

    const sendRegenerateAnswerAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.regenerate_answer,
        });
    };

    const sendUseAnswerAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.use_answer,
        });
    };

    const sendRequestAssistantReport = ({
        ingestionTime,
        generationTime,
        tokensGenerated,
    }: {
        ingestionTime: number;
        generationTime: number;
        tokensGenerated: number;
    }) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.request_assistant,
            values: {
                ingestion_time: ingestionTime,
                generation_time: generationTime,
                tokens_generated: tokensGenerated,
            },
        });
    };

    const sendSendMessageAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.send_message,
        });
    };

    const sendCancelDownloadAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.cancel_download,
        });
    };

    const sendLoadModelAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.load_model,
        });
    };

    const sendUnloadModelAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.unload_model,
        });
    };

    return {
        sendShowAssistantReport,
        sendDownloadAssistantReport,
        sendRequestHelpAssistantReport,
        sendRegenerateAnswerAssistantReport,
        sendUseAnswerAssistantReport,
        sendRequestAssistantReport,
        sendSendMessageAssistantReport,
        sendCancelDownloadAssistantReport,
        sendLoadModelAssistantReport,
        sendUnloadModelAssistantReport,
    };
};

export default useAssistantTelemetry;
