import { useApi } from '@proton/components/hooks';
import { TelemetryMailComposerAssistantEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

export const enum ASSISTANT_TYPE {
    SERVER, // 0
    LOCAL, // 1
}

export const enum GENERATION_TYPE {
    WRITE_FULL_EMAIL, // 0
    SHORTEN, // 1
    PROOFREAD, // 2
    EXPAND, // 3
    FORMALIZE, // 4
    FRIENDLY, // 5
    CUSTOM_REFINE, // 6
}

export const enum ERROR_TYPE {
    GENERATION_HARMFUL, // 0
    GENERATION_FAIL, // 1
    LOADGPU_FAIL, // 2
    DOWNLOAD_FAIL, // 3
    UNLOAD_FAIL, // 4
    GENERATION_CANCEL_FAIL, // 5
}

const useAssistantTelemetry = () => {
    const api = useApi();

    const sendShowAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.show_assistant,
        });
    };

    const sendFreeTrialStart = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.free_trial_start,
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

    const sendUseAnswerAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.use_answer,
        });
    };

    const sendNotUseAnswerAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.not_use_answer,
        });
    };

    const sendRequestAssistantReport = ({
        assistantType,
        generationType,
        ingestionTime,
        generationTime,
        tokensGenerated,
    }: {
        assistantType: ASSISTANT_TYPE;
        generationType: GENERATION_TYPE;
        ingestionTime: number;
        generationTime: number;
        tokensGenerated: number;
    }) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.request_assistant,
            values: {
                assistant_type: assistantType,
                generation_type: generationType,
                ingestion_time: ingestionTime,
                generation_time: generationTime,
                tokens_generated: tokensGenerated,
            },
        });
    };

    const sendAssistantErrorReport = ({
        assistantType,
        errorType,
    }: {
        assistantType: ASSISTANT_TYPE;
        errorType: ERROR_TYPE;
    }) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.assistant_error,
            values: {
                assistant_type: assistantType,
                error_type: errorType,
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

    const sendPauseDownloadAssistantReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.pause_download,
        });
    };

    const sendLoadModelAssistantReport = (loadTime: number) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.load_model,
            values: {
                load_time: loadTime,
            },
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
        sendFreeTrialStart,
        sendDownloadAssistantReport,
        sendUseAnswerAssistantReport,
        sendNotUseAnswerAssistantReport,
        sendRequestAssistantReport,
        sendAssistantErrorReport,
        sendSendMessageAssistantReport,
        sendPauseDownloadAssistantReport,
        sendLoadModelAssistantReport,
        sendUnloadModelAssistantReport,
    };
};

export default useAssistantTelemetry;
