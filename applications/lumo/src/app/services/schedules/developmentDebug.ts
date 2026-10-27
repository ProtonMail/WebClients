import type { ScheduleService } from './ScheduleService';
import type { ScheduleRunResult, ScheduleServiceSnapshot } from './types';

type RunSummary = Pick<ScheduleRunResult, 'outcome' | 'finishedAt'> & { runId: string; scheduleId: string };

interface ScheduleDebugConsole {
    status(): ScheduleServiceSnapshot;
    refresh(): Promise<void>;
    runs(): Promise<RunSummary[]>;
    result(runId?: string): Promise<ScheduleRunResult | undefined>;
}

declare global {
    interface Window {
        LumoScheduleDebug?: ScheduleDebugConsole;
    }
}

/** Provides development-console access to the active account's scheduler and saved results. */
export function attachScheduleDebug({
    service,
    results,
    isCurrentAccount,
}: {
    service: Pick<ScheduleService, 'getSnapshot' | 'refresh'>;
    results: {
        getResult(runId: string): Promise<ScheduleRunResult | undefined>;
        listResults(): Promise<ScheduleRunResult[]>;
    };
    isCurrentAccount: () => boolean;
}): () => void {
    let attached = true;
    const guard = () => {
        if (!attached || !isCurrentAccount() || service.getSnapshot().status === 'stopped') {
            throw new DOMException('Schedule debugging context expired', 'AbortError');
        }
    };
    const controls: ScheduleDebugConsole = {
        status() {
            guard();
            return structuredClone(service.getSnapshot());
        },
        async refresh() {
            guard();
            await service.refresh();
            guard();
        },
        async runs() {
            guard();
            const saved = await results.listResults();
            guard();
            return saved.map(({ run, outcome, finishedAt }) => ({
                runId: run.runId,
                scheduleId: run.scheduleId,
                outcome,
                finishedAt,
            }));
        },
        async result(runId) {
            guard();
            const result = runId === undefined ? (await results.listResults())[0] : await results.getResult(runId);
            guard();
            return result;
        },
    };
    window.LumoScheduleDebug = controls;
    return () => {
        attached = false;
        if (window.LumoScheduleDebug === controls) delete window.LumoScheduleDebug;
    };
}
