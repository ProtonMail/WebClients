import { Logger } from '../../../../Logger';
import { InvalidIndexerState, isAbortError, isPermanentError } from '../../../../errors';
import { getEngineConfig } from '../../../configs';
import { runBulkUpdate } from './states/runBulkUpdate';
import { runCleanup } from './states/runCleanup';
import { runIncrementalUpdate } from './states/runIncrementalUpdate';
import { InitOutcome, runInit } from './states/runInit';
import { runScheduleIncrementalUpdate } from './states/runScheduleIncrementalUpdate';
import { runTransientFailure } from './states/runTransientFailure';
import type { IndexerContext, IndexerStateMachineParams } from './types';

enum IndexerState {
    // Not yet started, or cleanly stopped.
    IDLE = 'IDLE',
    // First state: Decide whether to rebuild the index from scratch or resume incremental updates.
    INIT = 'INIT',
    // Build the index from scratch by iterating all items and store a checkpoint.
    BULK_UPDATE = 'BULK_UPDATE',
    // Release stale index blobs left over from a previous version.
    CLEANUP = 'CLEANUP',
    // Fetch and apply changes that arrived since the last checkpoint.
    INCREMENTAL_UPDATE = 'INCREMENTAL_UPDATE',
    // Wait for the next incremental update interval.
    SCHEDULE_INCREMENTAL_UPDATE = 'SCHEDULE_INCREMENTAL_UPDATE',
    // A recoverable error occurred; wait with exponential backoff before retrying from INIT.
    TRANSIENT_FAILURE = 'TRANSIENT_FAILURE',
    // A permanent, unrecoverable error — the state machine is stopped and might require external actions to be fixed.
    STOP = 'STOP',
}

export class IndexerStateMachine {
    private state: IndexerState = IndexerState.IDLE;
    private abortController: AbortController = new AbortController();
    private readonly ctx: IndexerContext;

    constructor(params: IndexerStateMachineParams) {
        this.ctx = {
            db: params.db,
            bridgeService: params.bridgeService,
            indexWriter: params.indexWriter,
            config: getEngineConfig(params.requiredConfigKey),
            requiredConfigKey: params.requiredConfigKey,
            lastError: null,
            transientFailureCount: 0,
        };

        // When a client disconnect and new one reconnect (ie a tab is closed and another), we need
        // Note: No need to unsubscribe from the bridge service: We never want to stop listening to it.
        params.bridgeService.onChange(() => {
            Logger.info('IndexerStateMachine: bridge updated');
            switch (this.state) {
                case IndexerState.BULK_UPDATE:
                case IndexerState.INCREMENTAL_UPDATE:
                    // Restart indexing steps from scratch: Not optimal but robust for now.
                    this.abortAndReenter(this.state);
                    break;
                default:
                    // Other states: no interruption needed.
                    break;
            }
        });
    }

    getState(): IndexerState {
        return this.state;
    }

    /**
     * Start the state machine from INIT.
     */
    async start(): Promise<void> {
        if (this.state !== IndexerState.IDLE) {
            Logger.warn(`IndexerStateMachine: cannot start, current state is ${this.state}`);
            return;
        }

        this.abortController = new AbortController();
        await this.runLoop(IndexerState.INIT, this.abortController.signal);
    }

    /**
     * Stop the state machine and cancel any pending or scheduled work.
     * Aborting the signal also cancels timer-based states (SCHEDULE, TRANSIENT_FAILURE).
     */
    stop(): void {
        Logger.info('IndexerStateMachine: stopping');
        this.abortController.abort();
        this.abortController = new AbortController();
        this.state = IndexerState.IDLE;
    }

    /**
     * Abort the in-progress operation and immediately re-enter the given state
     * using a fresh AbortController. Each invocation of a state handler captures
     * its own signal, so the old run exits cleanly while the new one proceeds.
     */
    private abortAndReenter(state: IndexerState): void {
        this.abortController.abort();
        this.abortController = new AbortController();
        void this.runLoop(state, this.abortController.signal);
    }

    /**
     * Core state machine loop. Drives the state machine by calling each handler and deciding
     * the next state based on its result. The catch block here is the single
     * place that classifies errors into TRANSIENT_FAILURE or STOP.
     */
    private async runLoop(fromState: IndexerState, signal: AbortSignal): Promise<void> {
        let state = fromState;

        while (state !== IndexerState.STOP) {
            if (signal.aborted) {
                return;
            }

            Logger.info(`IndexerStateMachine: → ${state}`);
            this.state = state;

            try {
                switch (state) {
                    case IndexerState.INIT: {
                        const data = await runInit(this.ctx, signal);
                        state =
                            data.outcome === InitOutcome.NEEDS_BULK_UPDATE
                                ? IndexerState.BULK_UPDATE
                                : IndexerState.CLEANUP;
                        break;
                    }

                    case IndexerState.BULK_UPDATE: {
                        const bridge = this.ctx.bridgeService.get();
                        if (!bridge) {
                            throw new InvalidIndexerState('No main thread bridge provided');
                        }
                        await runBulkUpdate(this.ctx, bridge, signal);
                        state = IndexerState.INCREMENTAL_UPDATE;
                        break;
                    }

                    case IndexerState.CLEANUP: {
                        await runCleanup();
                        state = IndexerState.INCREMENTAL_UPDATE;
                        break;
                    }

                    case IndexerState.INCREMENTAL_UPDATE: {
                        // TODO: Handle missing checkpoint case here (transition to BULK_UPDATE and logger.warn).
                        await runIncrementalUpdate();
                        state = IndexerState.SCHEDULE_INCREMENTAL_UPDATE;
                        break;
                    }

                    case IndexerState.SCHEDULE_INCREMENTAL_UPDATE: {
                        await runScheduleIncrementalUpdate(this.ctx, signal);
                        // Full healthy cycle completed — reset failure tracking so the next
                        // independent failure series starts back-off from the beginning.
                        this.ctx.transientFailureCount = 0;
                        this.ctx.lastError = null;
                        state = IndexerState.INCREMENTAL_UPDATE;
                        break;
                    }

                    case IndexerState.TRANSIENT_FAILURE: {
                        await runTransientFailure(this.ctx, signal);
                        state = IndexerState.INIT;
                        break;
                    }
                }
            } catch (e) {
                if (isAbortError(e) || signal.aborted) {
                    return;
                }

                Logger.error(`IndexerStateMachine: ${state} failed`, e);
                this.ctx.lastError = e;

                if (isPermanentError(e)) {
                    state = IndexerState.STOP;
                } else {
                    this.ctx.transientFailureCount++;
                    state = IndexerState.TRANSIENT_FAILURE;
                }
            }
        }

        // Exited via STOP — a permanent failure was encountered.
        // TODO: For quota exceeded permanent failure: Maybe notify user with an error banner ?
        // TODO: For corrupted DB permanent failure: Maybe reset DB ?
        // TODO: Increment Grafana counter for permanent failures.
        Logger.error('IndexerStateMachine: permanently stopped', this.ctx.lastError);
        this.state = IndexerState.STOP;
        this.abortController.abort();
        this.abortController = new AbortController();
    }
}
