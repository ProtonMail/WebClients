/** Mirrors lumo-desktop/webview/schedule-types.ts, protocol v1. */
export type ScheduleTiming =
    | { kind: 'once'; at: string }
    | { kind: 'daily'; time: string; timezone: string }
    | { kind: 'weekly'; days: number[]; time: string; timezone: string }
    | { kind: 'monthly'; days: number[]; time: string; timezone: string };

export type ScheduleDefinition = {
    id: string;
    timingRevision: number;
    enabled: boolean;
    timing: ScheduleTiming;
    missedRunPolicy: 'catch_up' | 'run_once';
};

export type ScheduleRunStatus = 'pending' | 'accepted' | 'running' | 'succeeded' | 'failed' | 'interrupted' | 'skipped';

export type ScheduleRun = {
    runId: string;
    scheduleId: string;
    timingRevision: number;
    scheduledFor: string;
    status: ScheduleRunStatus;
    updatedAt: string;
};

export type ScheduleConnection = { connectionId: string; protocolVersion: 1 };
export type ScheduleWorkAvailable = { connectionId: string };

export interface DesktopSchedulesApi {
    connect(input: { accountId: string; protocolVersion: 1 }): Promise<ScheduleConnection>;
    /** Complete snapshot for this device. A fetch failure must never become an empty snapshot. */
    replaceSchedules(input: { connectionId: string; schedules: ScheduleDefinition[] }): Promise<void>;
    getPendingRuns(input: { connectionId: string }): Promise<ScheduleRun[]>;
    getUnsettledRuns(input: { connectionId: string }): Promise<ScheduleRun[]>;
    reportRunStatus(input: {
        connectionId: string;
        runId: string;
        status: Exclude<ScheduleRunStatus, 'pending'>;
    }): Promise<void>;
    onWorkAvailable(callback: (event: ScheduleWorkAvailable) => void): () => void;
}

declare global {
    interface Window {
        LumoSchedules?: DesktopSchedulesApi;
    }
}

export function getDesktopSchedulesApi(): DesktopSchedulesApi | undefined {
    return typeof window === 'undefined' ? undefined : window.LumoSchedules;
}
