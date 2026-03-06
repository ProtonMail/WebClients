import { Logger } from '../../../../../../Logger';
import { abortableDelay } from '../../stateMachineUtils';
import type { IndexerContext } from '../../types';

const BASE_DELAY_MS = 10_000; //  10 s
const MAX_DELAY_MS = 600_000; // 600 s (10 min)

/**
 * TRANSIENT_FAILURE: A recoverable error occurred. Wait, then retry from INIT.
 *
 * Delay follows an exponential back-off: BASE * 2^(attempt - 1), capped at MAX.
 * The attempt counter is incremented by the state machine on each TRANSIENT_FAILURE
 * entry and accumulates across consecutive failures. It is reset by the state machine
 * only after a full healthy cycle completes (SCHEDULE_INCREMENTAL_UPDATE succeeds).
 */
export const runTransientFailure = async (ctx: IndexerContext, signal: AbortSignal): Promise<void> => {
    const delayMs = Math.min(BASE_DELAY_MS * 2 ** (ctx.transientFailureCount - 1), MAX_DELAY_MS);
    Logger.info(
        `IndexerStateMachine: TRANSIENT_FAILURE — attempt ${ctx.transientFailureCount}, retrying in ${delayMs / 1000}s`
    );
    await abortableDelay(delayMs, signal);
};
