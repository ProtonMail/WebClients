import { Logger } from '../../../../shared/Logger';
import { isPermanentError, sendErrorReportForSearch } from '../../../../shared/errors';
import type { IndexPopulatorRegistration } from '../../TreeSubscriptionRegistry';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

/**
 * Processes buffered tree events for a single IndexPopulator.
 * Enqueued by TreeSubscriptionRegistry when events arrive (debounced).
 */
export class IncrementalUpdateTask extends BaseTask {
    constructor(private readonly registration: IndexPopulatorRegistration) {
        super();
    }

    getUid(): string {
        return `task-IncrementalUpdate:${this.registration.populator.getUid()}`;
    }

    async execute(ctx: TaskContext): Promise<void> {
        const { registration } = this;
        const populatorUid = registration.populator.getUid();

        const events = registration.collector.peek();
        Logger.info(`IncrementalUpdate: processing ${events.length} events for ${populatorUid}`);

        try {
            if (events.length > 0) {
                const processed = await registration.populator.processIncrementalUpdates(events, ctx);
                if (processed > 0) {
                    registration.collector.commit(processed);
                    registration.lastEventId = events[processed - 1].eventId;
                    registration.subscriptionTime = Date.now();
                }
            }
        } catch (e) {
            if (isPermanentError(e)) {
                throw e;
            }
            Logger.error(`Uncaught incremental update error for <${populatorUid}>`, e);
            sendErrorReportForSearch(e);
        } finally {
            ctx.treeSubscriptionRegistry.markIncrementalUpdateComplete(registration);
        }
    }
}
