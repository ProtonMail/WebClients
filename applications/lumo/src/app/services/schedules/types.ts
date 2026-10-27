import type { ScheduleDefinition, ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';
import type { AssistantCallOptions, Turn } from '@proton/lumo-api-client/core/types';

import type { Message } from '../../types';

export type ScheduleContext = { accountId: string; signal: AbortSignal };
export type ScheduleOutcome = 'succeeded' | 'failed' | 'interrupted';

/** Supplies the complete timing snapshot from local storage or an API adapter. */
export interface ScheduleSource {
    list(context: ScheduleContext): Promise<ScheduleDefinition[]>;
}

export type ScheduleTask = {
    id: string;
    timingRevision: number;
    prompt: string;
    name?: string;
    notifyOnComplete?: boolean;
    connectorIds: string[];
    autoApprove?: boolean;
    modelTier?: AssistantCallOptions['modelTier'];
    enableReasoning?: boolean;
};

export interface ScheduleTaskSource extends ScheduleSource {
    getTask(run: ScheduleRun, context: ScheduleContext): Promise<ScheduleTask | undefined>;
}

export function isScheduleTaskSource(source: ScheduleSource | undefined): source is ScheduleTaskSource {
    return !!source && 'getTask' in source && typeof source.getTask === 'function';
}

export type ScheduleRunResult = {
    run: ScheduleRun;
    outcome: ScheduleOutcome;
    producedTurns: Turn[];
    finishedAt: string;
    conversationId?: string;
};

export type ScheduleExecutionTarget = {
    conversationId: string;
    prompt: Message;
    assistant: Message;
};

export type ScheduleExecutionResult = {
    outcome: ScheduleOutcome;
    messageIds: string[];
};

export type ScheduleCompletion = ScheduleExecutionResult & { run: ScheduleRun; finishedAt: string };

export interface ScheduleRunRepository {
    /** True only after this desktop successfully creates the shared occurrence conversation. */
    claim(run: ScheduleRun): Promise<boolean>;
    startRun(run: ScheduleRun, task: ScheduleTask): Promise<ScheduleExecutionTarget>;
    finishRun(result: ScheduleCompletion): Promise<ScheduleOutcome>;
    getStatus(runId: string): Promise<'running' | ScheduleOutcome | undefined>;
    interruptRun(run: ScheduleRun): Promise<ScheduleOutcome>;
    getResult(runId: string): Promise<ScheduleRunResult | undefined>;
}

/** The agent adapter owns task lookup and durable results. The service owns delivery status. */
export interface ScheduleExecutor {
    /** Reserve the shared occurrence before acknowledging it to desktop. */
    claim(run: ScheduleRun, context: ScheduleContext): Promise<boolean>;
    execute(run: ScheduleRun, context: ScheduleContext): Promise<ScheduleOutcome>;
    /** Consult existing execution state; never restart an accepted/running task here. */
    reconcile(run: ScheduleRun, context: ScheduleContext): Promise<ScheduleOutcome | undefined>;
}

export type ScheduleServiceSnapshot = {
    status: 'stopped' | 'connecting' | 'waiting' | 'ready' | 'running' | 'error';
    connectionId?: string;
    pendingRuns: readonly ScheduleRun[];
    unsettledRuns: readonly ScheduleRun[];
    activeRunId?: string;
    error?: unknown;
};

export const STOPPED_SCHEDULE_SNAPSHOT: ScheduleServiceSnapshot = {
    status: 'stopped',
    pendingRuns: [],
    unsettledRuns: [],
};

/** Keep the native run unsettled when a durable result cannot be recorded. */
export class SchedulePersistenceError extends Error {}
