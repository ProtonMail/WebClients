import type {
    DesktopSchedulesApi,
    ScheduleConnection,
    ScheduleDefinition,
    ScheduleRun,
} from '@proton/lumo-api-client/core/desktop-schedules';

import {
    STOPPED_SCHEDULE_SNAPSHOT,
    type ScheduleContext,
    type ScheduleExecutor,
    type ScheduleOutcome,
    SchedulePersistenceError,
    type ScheduleServiceSnapshot,
    type ScheduleSource,
} from './types';

type Session = {
    controller: AbortController;
    connection?: ScheduleConnection;
    definitions?: ScheduleDefinition[];
    requested: boolean;
    syncRequired: boolean;
    pumping?: Promise<void>;
    timer?: ReturnType<typeof setInterval>;
    unsubscribe?: () => void;
    outcomes: Map<string, ScheduleOutcome | 'skipped'>;
};

type Options = {
    accountId: string;
    bridge: DesktopSchedulesApi;
    isCurrentAccount: () => boolean;
    source?: ScheduleSource;
    executor?: ScheduleExecutor;
    pollIntervalMs?: number;
};

/** Route-independent delivery lifecycle. No React, timers for recurrence, or agent implementation. */
export class ScheduleService {
    private session?: Session;
    private snapshot = STOPPED_SCHEDULE_SNAPSHOT;
    private readonly listeners = new Set<() => void>();

    constructor(private readonly options: Options) {}

    getSnapshot = (): ScheduleServiceSnapshot => this.snapshot;

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    start(): Promise<void> {
        if (this.session) return this.session.pumping ?? Promise.resolve();
        if (!this.options.isCurrentAccount()) return Promise.resolve();
        const session: Session = {
            controller: new AbortController(),
            requested: false,
            syncRequired: true,
            outcomes: new Map(),
        };
        this.session = session;
        this.update({ ...STOPPED_SCHEDULE_SNAPSHOT, status: 'connecting' });
        session.unsubscribe = this.options.bridge.onWorkAvailable(({ connectionId }) => {
            if (this.active(session) && session.connection?.connectionId === connectionId) {
                void this.requestRefresh(false);
            }
        });
        // Also checks auth while execution is awaiting a network/tool result. Hidden windows
        // keep polling; document visibility must not determine whether scheduled work runs.
        session.timer = setInterval(() => {
            if (this.session !== session) return;
            if (!this.options.isCurrentAccount()) {
                this.stop();
                return;
            }
            void this.requestRefresh(true);
        }, this.options.pollIntervalMs ?? 15_000);
        return this.requestRefresh(true);
    }

    stop(): void {
        const session = this.session;
        this.session = undefined;
        if (session) {
            session.controller.abort();
            session.unsubscribe?.();
            clearInterval(session.timer);
        }
        this.update(STOPPED_SCHEDULE_SNAPSHOT);
    }

    /** UI/API changes may request a fresh snapshot without remounting the service. */
    refresh = (): Promise<void> => this.requestRefresh(true);

    /** Persist manual work in native storage, then deliver it through the normal execution loop. */
    runNow = async (scheduleId: string): Promise<ScheduleRun> => {
        const session = this.session;
        if (!session || !this.options.source || !this.options.executor) {
            throw new Error('Schedule execution is unavailable');
        }
        this.guard(session);
        await this.refresh();
        this.guard(session);
        const connectionId = session.connection?.connectionId;
        if (!connectionId || this.snapshot.status !== 'ready') {
            throw new Error('Schedule execution is not ready');
        }
        const run = await this.options.bridge.runNow({ connectionId, scheduleId });
        this.guard(session);
        this.update({ ...this.snapshot, pendingRuns: [...this.snapshot.pendingRuns, run] });
        void this.requestRefresh(false);
        return run;
    };

    private active(session: Session): boolean {
        return this.session === session && !session.controller.signal.aborted && this.options.isCurrentAccount();
    }

    private guard(session: Session): void {
        if (!this.active(session)) throw new DOMException('Schedule service stopped', 'AbortError');
    }

    private context(session: Session): ScheduleContext {
        return { accountId: this.options.accountId, signal: session.controller.signal };
    }

    private update(snapshot: ScheduleServiceSnapshot): void {
        this.snapshot = snapshot;
        for (const listener of this.listeners) listener();
    }

    private requestRefresh(sync: boolean): Promise<void> {
        const session = this.session;
        if (!session) return Promise.resolve();
        if (!this.active(session)) {
            this.stop();
            return Promise.resolve();
        }
        session.requested = true;
        session.syncRequired ||= sync;
        if (!session.pumping) {
            session.pumping = this.pump(session).finally(() => {
                session.pumping = undefined;
            });
        }
        return session.pumping;
    }

    private async pump(session: Session): Promise<void> {
        while (session.requested && this.active(session)) {
            session.requested = false;
            const sync = session.syncRequired;
            session.syncRequired = false;
            try {
                await this.cycle(session, sync);
            } catch (error) {
                if (!this.active(session)) return;
                session.connection = undefined;
                session.definitions = undefined;
                session.syncRequired = true;
                this.update({
                    ...this.snapshot,
                    status: 'error',
                    connectionId: undefined,
                    activeRunId: undefined,
                    error,
                });
                // Retry on the next poll/manual refresh, never in an immediate error loop.
                session.requested = false;
            }
        }
    }

    private async cycle(session: Session, sync: boolean): Promise<void> {
        const { bridge, source, executor, accountId } = this.options;
        this.guard(session);
        if (!session.connection) {
            const connection = await bridge.connect({ accountId, protocolVersion: 1 });
            this.guard(session);
            if (connection.protocolVersion !== 1) throw new Error('Unsupported schedule bridge protocol');
            session.connection = connection;
            sync = true;
        }
        const { connectionId } = session.connection;
        if (source && sync) {
            const definitions = await source.list(this.context(session));
            this.guard(session);
            await bridge.replaceSchedules({ connectionId, schedules: definitions });
            this.guard(session);
            session.definitions = definitions;
        }
        const unsettled = await bridge.getUnsettledRuns({ connectionId });
        this.guard(session);
        const pending = await bridge.getPendingRuns({ connectionId });
        this.guard(session);
        const ready = !!(source && executor && session.definitions);
        this.update({
            status: ready ? 'ready' : 'waiting',
            connectionId,
            pendingRuns: pending,
            unsettledRuns: unsettled,
        });
        if (!ready || !executor) return;

        // Reconcile accepted/running work before considering new starts. An unknown outcome
        // remains unsettled; it must not be re-executed merely because this page reloaded.
        const blockedSchedules = new Set<string>();
        for (const run of unsettled) {
            let outcome = session.outcomes.get(run.runId);
            if (!outcome) outcome = await executor.reconcile(run, this.context(session));
            this.guard(session);
            if (outcome) await this.finish(session, run, outcome);
            else blockedSchedules.add(run.scheduleId);
        }
        for (const run of pending) {
            this.guard(session);
            if (blockedSchedules.has(run.scheduleId)) continue;
            const knownOutcome = session.outcomes.get(run.runId);
            if (knownOutcome) {
                await this.finish(session, run, knownOutcome);
                continue;
            }
            const definition = session.definitions?.find((item) => item.id === run.scheduleId);
            if (!definition?.enabled || definition.timingRevision !== run.timingRevision) continue;
            let claimed: boolean;
            try {
                claimed = await executor.claim(run, this.context(session));
            } catch (error) {
                this.guard(session);
                // Leave uncertain claims pending for a later poll without blocking other tasks.
                console.error('Could not claim scheduled run', run.runId, error);
                continue;
            }
            this.guard(session);
            if (!claimed) {
                await this.finish(session, run, 'skipped');
                continue;
            }
            await bridge.reportRunStatus({ connectionId, runId: run.runId, status: 'accepted' });
            this.guard(session);
            this.update({
                ...this.snapshot,
                pendingRuns: this.snapshot.pendingRuns.filter((item) => item.runId !== run.runId),
                unsettledRuns: [...this.snapshot.unsettledRuns, { ...run, status: 'accepted' }],
            });
            await bridge.reportRunStatus({ connectionId, runId: run.runId, status: 'running' });
            this.guard(session);
            this.update({
                ...this.snapshot,
                status: 'running',
                activeRunId: run.runId,
                unsettledRuns: this.snapshot.unsettledRuns.map((item) =>
                    item.runId === run.runId ? { ...item, status: 'running' } : item
                ),
            });
            let outcome: ScheduleOutcome;
            try {
                outcome = await executor.execute(run, this.context(session));
            } catch (error) {
                if (error instanceof SchedulePersistenceError) throw error;
                // A thrown error does not prove that no external action happened.
                outcome = 'interrupted';
            }
            this.guard(session);
            await this.finish(session, run, outcome);
        }
        this.guard(session);
        this.update({ ...this.snapshot, status: 'ready', activeRunId: undefined });
    }

    private async finish(session: Session, run: ScheduleRun, outcome: ScheduleOutcome | 'skipped'): Promise<void> {
        this.guard(session);
        // Retain outcomes if the status acknowledgment is lost: retry reporting, not execution.
        session.outcomes.set(run.runId, outcome);
        await this.options.bridge.reportRunStatus({
            connectionId: session.connection!.connectionId,
            runId: run.runId,
            status: outcome,
        });
        this.guard(session);
        this.update({
            ...this.snapshot,
            pendingRuns: this.snapshot.pendingRuns.filter((item) => item.runId !== run.runId),
            unsettledRuns: this.snapshot.unsettledRuns.filter((item) => item.runId !== run.runId),
        });
    }
}
