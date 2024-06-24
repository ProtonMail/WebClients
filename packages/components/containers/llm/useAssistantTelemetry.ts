import { useApi } from '@proton/components/hooks';
import { TelemetryMailComposerAssistantEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

export const enum ASSISTANT_TYPE {
    SERVER = 'SERVER',
    LOCAL = 'LOCAL',
}

export const enum GENERATION_TYPE {
    WRITE_FULL_EMAIL = 'WRITE_FULL_EMAIL',
    SHORTEN = 'SHORTEN',
    PROOFREAD = 'PROOFREAD',
    EXPAND = 'EXPAND',
    FORMALIZE = 'FORMALIZE',
    FRIENDLY = 'FRIENDLY',
    CUSTOM_REFINE = 'CUSTOM_REFINE',
}

export const enum ERROR_TYPE {
    GENERATION_HARMFUL = 'GENERATION_HARMFUL',
    GENERATION_FAIL = 'GENERATION_FAIL',
    LOADGPU_FAIL = 'LOADGPU_FAIL',
    DOWNLOAD_FAIL = 'DOWNLOAD_FAIL',
    UNLOAD_FAIL = 'UNLOAD_FAIL',
    GENERATION_CANCEL_FAIL = 'GENERATION_CANCEL_FAIL',
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

export const enum INCOMPATIBILITY_TYPE {
    BROWSER = 'BROWSER',
    HARDWARE = 'HARDWARE',
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
                ingestion_time: ingestionTime,
                generation_time: generationTime,
                tokens_generated: tokensGenerated,
            },
            dimensions: {
                assistant_type: assistantType,
                generation_type: generationType,
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
            dimensions: {
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

    const sendIncompatibleAssistantReport = ({
        incompatibilityType,
    }: {
        incompatibilityType: INCOMPATIBILITY_TYPE;
    }) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.incompatible_assistant,
            dimensions: {
                incompatibility_type: incompatibilityType,
            },
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
        sendIncompatibleAssistantReport,
    };
};

export default useAssistantTelemetry;
