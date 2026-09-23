import { useRef } from 'react';

import { useApi } from '@proton/app-context/useApi';
import type { ToolKind, ToolName } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { LumoAgentTelemetry, LumoConfirmAnswer } from '@proton/llm/lib/lumoAgent/ui/types';
import { LumoChainEnd } from '@proton/llm/lib/lumoAgent/ui/types';
import { TelemetryMailLumoEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

/** The `reason` dimension, shared by `chain_end` and `tool_end`; a tool only ever reports the first two. */
enum EndReason {
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    USER_STOPPED = 'user_stopped',
    ROUND_BUDGET = 'round_budget',
    REPLACED = 'replaced',
    DISCARDED = 'discarded',
}

enum PromptSource {
    TYPED = 'typed',
    SUGGESTION_CARD = 'suggestion_card',
}

/** What an `allowed_values` dimension carries when it has nothing to report, per the telemetry README. */
const ABSENT = 'n/a';

/** Keeps the wire vocabulary Mail's own, so renaming a member of the framework's enum cannot move a chart. */
const CHAIN_END_REASONS: Record<LumoChainEnd, EndReason> = {
    [LumoChainEnd.SUCCEEDED]: EndReason.SUCCEEDED,
    [LumoChainEnd.FAILED]: EndReason.FAILED,
    [LumoChainEnd.STOPPED]: EndReason.USER_STOPPED,
    [LumoChainEnd.BUDGET]: EndReason.ROUND_BUDGET,
    [LumoChainEnd.REPLACED]: EndReason.REPLACED,
    [LumoChainEnd.DISCARDED]: EndReason.DISCARDED,
};

/** The reporters `buildLumoMailConfig` closes over; the rest are called straight from a component. */
export interface LumoMailConfigTelemetry extends LumoAgentTelemetry {
    toolSucceeded: (toolName: ToolName, toolKind: ToolKind) => void;
    toolFailed: (toolName: ToolName, toolKind: ToolKind) => void;
}

interface LumoMailTelemetry extends LumoMailConfigTelemetry {
    assistantOpened: () => void;
    suggestionPicked: (cardId: string) => void;
    debugReportOpened: () => void;
}

/**
 * The only place that knows Lumo's event names and dimension strings; everything else reports a fact and
 * stays word-blind, so a schema change lands here and nowhere else.
 *
 * Safe to call outside `LumoMailProvider`, since it needs nothing but the api. The picked card is held
 * per instance, so the instance that records a pick has to be the one that reports the send.
 */
export const useLumoMailTelemetry = (): LumoMailTelemetry => {
    const api = useApi();
    const pickedCardRef = useRef<string | null>(null);

    const report = (
        event: TelemetryMailLumoEvents,
        dimensions?: SimpleMap<string>,
        values?: SimpleMap<number>
    ): void => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailLumo,
            event,
            dimensions,
            values,
            delay: false,
        });
    };

    const reportTool = (toolName: ToolName, toolKind: ToolKind, reason: EndReason) =>
        report(TelemetryMailLumoEvents.tool_end, { toolName, toolKind, reason });

    return {
        assistantOpened: () => report(TelemetryMailLumoEvents.assistant_opened),

        suggestionPicked: (cardId: string) => {
            pickedCardRef.current = cardId;
        },

        promptSent: () => {
            const cardId = pickedCardRef.current;
            pickedCardRef.current = null;
            report(TelemetryMailLumoEvents.prompt_sent, {
                promptSource: cardId ? PromptSource.SUGGESTION_CARD : PromptSource.TYPED,
                suggestionCard: cardId ?? ABSENT,
            });
        },

        chainEnded: (end, { durationMs, toolCalls, isResume }) =>
            report(
                TelemetryMailLumoEvents.chain_end,
                { isResumed: String(isResume), reason: CHAIN_END_REASONS[end] },
                { durationSeconds: durationMs / 1000, toolCalls }
            ),

        confirmAnswered: (tool: ToolName, answer: LumoConfirmAnswer) =>
            report(TelemetryMailLumoEvents.confirm_answered, { toolName: tool, answer }),

        toolSucceeded: (toolName: ToolName, toolKind: ToolKind) => reportTool(toolName, toolKind, EndReason.SUCCEEDED),

        toolFailed: (toolName: ToolName, toolKind: ToolKind) => reportTool(toolName, toolKind, EndReason.FAILED),

        debugReportOpened: () => report(TelemetryMailLumoEvents.debug_report_opened),
    };
};
