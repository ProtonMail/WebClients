import { Logger } from '../../../../shared/Logger';
import type { IndexPopulator } from '../../indexPopulators/IndexPopulator';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

/**
 * Task wrapper around an IndexPopulator.
 */
export class IndexPopulatorTask extends BaseTask {
    constructor(
        readonly populator: IndexPopulator,

        // True when running during the initial bootstrap sequence, false for
        // subsequent re-indexes triggered by live events.
        private readonly isBootstrap: boolean
    ) {
        super();
    }

    getUid(): string {
        return `task-${this.populator.getUid()}`;
    }

    async execute(ctx: TaskContext): Promise<void> {
        const { populator } = this;

        // Resolve lastEventId: from DB (previous session) or from API (first time).
        const sub = await ctx.db.getSubscription(populator.treeEventScopeId);
        const lastEventId =
            sub?.lastEventId ?? (await ctx.bridge.fetchLastEventIdForTreeScopeId(populator.treeEventScopeId)).EventID;

        // Always register tree subscription (needed for live events even if scan is done).
        await ctx.treeSubscriptionRegistry.register(populator.treeEventScopeId, populator, lastEventId, Date.now());

        // Version mismatch: schema changed — mark not-done so we re-index.
        if (!(await populator.hasUpToDateVersion(ctx.db))) {
            Logger.info(`${populator.getUid()}: version changed, marking as not done`);
            await populator.markAsNotDone(ctx.db);
        }

        // Skip traversal if already done.
        if (await populator.isDone(ctx.db)) {
            Logger.info(`${populator.getUid()}: already done, skipping`);
            return;
        }

        // Signal that indexing is happening.
        ctx.markIndexing();
        if (this.isBootstrap) {
            ctx.markInitialIndexing();
        }

        const { indexWriter } = await ctx.indexRegistry.get(populator.indexKind, ctx.db);
        const session = indexWriter.startWriteSession();
        try {
            for await (const entry of populator.visitAndProduceIndexEntries(ctx)) {
                ctx.signal.throwIfAborted();
                session.insert(entry);
            }
            await session.commit();
        } catch (e) {
            session.dispose();
            // TODO: Error handling hardening.
            Logger.error(`${populator.getUid()}: failed`, e);
            throw e;
        }

        // Mark done in DB.
        await ctx.db.putPopulatorState({
            uid: populator.getUid(),
            done: true,
            generation: await populator.getGeneration(ctx.db),
            version: populator.getVersion(),
        });
    }
}
