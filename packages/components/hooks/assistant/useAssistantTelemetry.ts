import { useApi } from '@proton/app-context/useApi';
import { TelemetryMailComposerAssistantEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type {
    ASSISTANT_INSERT_TYPE,
    ASSISTANT_TYPE,
    ERROR_TYPE,
    GENERATION_SELECTION_TYPE,
    GENERATION_TYPE,
    INCOMPATIBILITY_TYPE,
} from '@proton/shared/lib/assistant/types';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { useFlag } from '@proton/unleash/useFlag';

type AssistantReport = Pick<Parameters<typeof sendTelemetryReport>[0], 'event' | 'values' | 'dimensions'>;

const useAssistantTelemetry = () => {
    const api = useApi();
    // The roosterjs version of the composer the assistant writes into, with the values of useEditorVersion in @proton/mail-composer
    const editorVersion = useFlag('MailComposerRoosterV9') ? 'roosterjs-9' : 'roosterjs-8';

    const sendReport = ({ event, values, dimensions }: AssistantReport) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailComposerAssistant,
            event,
            values,
            dimensions: { ...dimensions, editor_version: editorVersion },
            delay: false,
        });
    };

    const sendShowAssistantReport = () => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.show_assistant,
        });
    };

    const sendFreeTrialStart = () => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.free_trial_start,
        });
    };

    const sendDownloadAssistantReport = (downloadTime: number) => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.download_model,
            values: {
                download_time: downloadTime,
            },
        });
    };

    const sendUseAnswerAssistantReport = (insertionType: ASSISTANT_INSERT_TYPE) => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.use_answer,
            dimensions: {
                insertion_type: insertionType,
            },
        });
    };

    const sendNotUseAnswerAssistantReport = () => {
        sendReport({
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
        sendReport({
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
        sendReport({
            event: TelemetryMailComposerAssistantEvents.assistant_error,
            dimensions: {
                assistant_type: assistantType,
                error_type: errorType,
            },
        });
    };

    const sendSendMessageAssistantReport = () => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.send_message,
        });
    };

    const sendPauseDownloadAssistantReport = () => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.pause_download,
        });
    };

    const sendLoadModelAssistantReport = (loadTime: number) => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.load_model,
            values: {
                load_time: loadTime,
            },
        });
    };

    const sendUnloadModelAssistantReport = () => {
        sendReport({
            event: TelemetryMailComposerAssistantEvents.unload_model,
        });
    };

    const sendIncompatibleAssistantReport = ({
        incompatibilityType,
    }: {
        incompatibilityType: INCOMPATIBILITY_TYPE;
    }) => {
        sendReport({
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
