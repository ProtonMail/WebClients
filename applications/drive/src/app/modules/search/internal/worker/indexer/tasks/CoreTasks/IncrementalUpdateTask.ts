import { Logger } from '../../../../shared/Logger';
import type { IndexPopulatorRegistration } from '../../TreeSubscriptionRegistry';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

/**
 * Processes buffered tree events for a single IndexPopulator.
 * Enqueued by TreeSubscriptionRegistry when events arrive (debounced).
 *
 * Errors propagate to IndexerTaskQueue, which records both the lifecycle
 * counter and the severity counter (markIndexer{Permanent|Transient}Error)
 * and decides retry vs stop.
 */
export class IncrementalUpdateTask extends BaseTask {
    constructor(private readonly registration: IndexPopulatorRegistration) {
        super();
    }

    getUid(): string {
        return `${this.getKind()}:${this.registration.populator.getUid()}`;
    }

    getKind(): IndexerTaskKind {
        return 'incremental-update-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        const { registration } = this;
        const populatorUid = registration.populator.getUid();

        const events = registration.collector.peek();
        Logger.info(`IncrementalUpdate: processing ${events.length} events for ${populatorUid}`);

        try {
            if (events.length === 0) {
                return;
            }

            const processed = await registration.populator.processIncrementalUpdates(events, ctx);
            if (processed > 0) {
                registration.collector.commit(processed);
                registration.lastEventId = events[processed - 1].eventId;
                registration.subscriptionTime = Date.now();
                ctx.notifyIndexingProgress();
            }
        } finally {
            ctx.treeSubscriptionRegistry.markIncrementalUpdateComplete(registration);
        }
    }
}
