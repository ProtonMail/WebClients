import { useApi } from '@proton/components/hooks';
import { TelemetryMailComposerAssistantEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type {
    ASSISTANT_TYPE,
    ERROR_TYPE,
    GENERATION_SELECTION_TYPE,
    GENERATION_TYPE,
    INCOMPATIBILITY_TYPE,
} from '@proton/shared/lib/assistant';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type { ASSISTANT_INSERT_TYPE } from 'proton-mail/hooks/assistant/useComposerAssistantGenerate';

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

    const sendUseAnswerAssistantReport = (insertionType: ASSISTANT_INSERT_TYPE) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event: TelemetryMailComposerAssistantEvents.use_answer,
            dimensions: {
                insertion_type: insertionType,
            },
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
        selectionType,
        ingestionTime,
        generationTime,
        tokensGenerated,
    }: {
        assistantType: ASSISTANT_TYPE;
        generationType: GENERATION_TYPE;
        selectionType: GENERATION_SELECTION_TYPE;
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
                selection_type: selectionType,
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
