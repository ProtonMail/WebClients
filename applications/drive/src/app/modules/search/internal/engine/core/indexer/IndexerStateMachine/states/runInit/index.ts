import { Logger } from '../../../../../../Logger';
import type { IndexerContext } from '../../types';

export enum InitOutcome {
    // The active config differs from the required one — the index must be rebuilt from scratch.
    NEEDS_BULK_UPDATE = 'needs_bulk_update',
    // The active config matches the required one — incremental updates can resume normally.
    UP_TO_DATE = 'up_to_date',
}

/**
 * INIT: Compare the required config against the last persisted active config.
 */
export const runInit = async (ctx: IndexerContext, _signal: AbortSignal): Promise<{ outcome: InitOutcome }> => {
    // Get the current active engine config currently active.
    const { activeConfigKey } = await ctx.db.getEngineState();

    // Get the required engine config that should be activated.
    const { requiredConfigKey } = ctx;

    Logger.info(
        `IndexerStateMachine: INIT — activeConfigKey=${activeConfigKey ?? 'none'}, requiredConfigKey=${requiredConfigKey}`
    );

    // A mismatch means the index was built with a different config — rebuild from scratch.
    const outcome = activeConfigKey !== requiredConfigKey ? InitOutcome.NEEDS_BULK_UPDATE : InitOutcome.UP_TO_DATE;
    return { outcome };
};
