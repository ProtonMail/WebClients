import { Logger } from '../../../../../../Logger';
import { abortableDelay } from '../../stateMachineUtils';

// TODO: Add some jitter here.
const INCREMENTAL_UPDATE_DELAY_MS = 30_000;

/**
 * SCHEDULE_INCREMENTAL_UPDATE: Wait 30 seconds, then trigger the next incremental update.
 */
export const runScheduleIncrementalUpdate = async (_ctx: unknown, signal: AbortSignal): Promise<void> => {
    Logger.info(
        `IndexerStateMachine: SCHEDULE_INCREMENTAL_UPDATE — next update in ${INCREMENTAL_UPDATE_DELAY_MS / 1000}s`
    );
    await abortableDelay(INCREMENTAL_UPDATE_DELAY_MS, signal);
};
