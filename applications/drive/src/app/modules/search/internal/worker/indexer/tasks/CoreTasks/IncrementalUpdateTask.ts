import { Logger } from '../../../../shared/Logger';
import { sendErrorReportForSearch } from '../../../../shared/errors';
import type { IndexPopulator } from '../../indexPopulators/IndexPopulator';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

const INTERVAL_MS = 60_000;

/**
 * Processes buffered tree events for a single IndexPopulator, then self-schedules
 * the next run after INTERVAL_MS. One task instance per populator.
 */
export class IncrementalUpdateTask extends BaseTask {
    constructor(private readonly populator: IndexPopulator) {
        super();
    }

    getUid(): string {
        return `task-IncrementalUpdate:${this.populator.getUid()}`;
    }

    async execute(ctx: TaskContext): Promise<void> {
        const registration = ctx.treeSubscriptionRegistry.getRegistration(this.populator);
        if (!registration) {
            const error = new Error(`IncrementalUpdate: no registration for ${this.populator.getUid()}`);
            Logger.error(error.message, error);
            sendErrorReportForSearch(error);
            ctx.enqueueDelayed(new IncrementalUpdateTask(this.populator), INTERVAL_MS);
            return;

            // TODO: Check if we can remove this invalid registration state by design (it will require some code shuffling).
        }

        // Stop at the first signal event (tree_refresh, tree_remove, shared_with_me_updated)
        // so that any tasks it enqueues (re-index, scope cleanup) run before we continue.
        const events = registration.collector.peekUntilSignalEvent();

        Logger.info(`IncrementalUpdate: processing ${events.length} events for ${this.populator.getUid()}`);

        if (events.length > 0) {
            try {
                await this.populator.processIncrementalUpdates(events, ctx);
                registration.collector.commit(events.length);
                registration.lastEventId = events[events.length - 1].eventId;
                registration.subscriptionTime = Date.now();
            } catch (e) {
                // Events remain in the collector for retry on the next cycle.
                // TODO: Improve error handling — a consistently failing populator will retry
                // the same events indefinitely. Consider a max-retry counter or backoff.
                Logger.error(`Critical: Uncaught incremental update error for <${this.populator.getUid()}>`);
                sendErrorReportForSearch(e);
            }
        }

        // Self-schedule next run.
        ctx.enqueueDelayed(new IncrementalUpdateTask(this.populator), INTERVAL_MS);
    }
}
