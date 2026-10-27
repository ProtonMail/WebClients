import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';

import type { ScheduleDetails } from '../../features/schedules/types';
import { type Space, isScheduleSpace } from '../../types';
import type { ScheduleStorage } from './ScheduleStorage';
import { getScheduleDefinition } from './scheduleSpace';
import type { ScheduleContext, ScheduleTaskSource } from './types';

export type ScheduleSourceSnapshot = {
    status: 'loading' | 'ready' | 'error';
    schedules: (ScheduleDetails & { id: string })[];
    error?: unknown;
};
const EMPTY_SCHEDULE_SOURCE_SNAPSHOT: ScheduleSourceSnapshot = { status: 'loading', schedules: [] };

/** Supplies schedule definitions and task content from encrypted schedule spaces. */
export class SpaceScheduleSource implements ScheduleTaskSource {
    private snapshot = EMPTY_SCHEDULE_SOURCE_SNAPSHOT;
    private listeners = new Set<() => void>();
    private spaces: Space[] = [];
    private unsubscribe?: () => void;

    constructor(
        private readonly accountId: string,
        private readonly storage: ScheduleStorage,
        private readonly localTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
    ) {}

    getSnapshot = (): ScheduleSourceSnapshot => this.snapshot;
    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    dispose = () => {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    };

    private guard(context?: ScheduleContext) {
        this.storage.guard();
        if (context?.signal.aborted || (context && context.accountId !== this.accountId)) {
            throw new DOMException('Schedule account is no longer active', 'AbortError');
        }
    }

    private publish = () => {
        this.guard();
        const spaces = Object.values(this.storage.store.getState().spaces).filter(isScheduleSpace);
        if (
            this.snapshot.status === 'ready' &&
            spaces.length === this.spaces.length &&
            spaces.every((space, i) => space === this.spaces[i])
        ) {
            return;
        }
        this.spaces = spaces;
        this.snapshot = {
            status: 'ready',
            schedules: spaces.map((space) => structuredClone({ ...space.schedule, id: space.id })),
        };
        for (const listener of this.listeners) listener();
    };

    load = async (): Promise<void> => {
        this.guard();
        this.unsubscribe ??= this.storage.store.subscribe(() => {
            if (this.storage.isCurrentAccount()) this.publish();
        });
        this.publish();
    };

    async list(context: ScheduleContext) {
        this.guard(context);
        await this.load();
        this.guard(context);
        return this.spaces.filter(isScheduleSpace).flatMap((space) => {
            const definition = getScheduleDefinition(space, this.localTimezone());
            return definition ? [definition] : [];
        });
    }

    async getTask(run: ScheduleRun, context: ScheduleContext) {
        this.guard(context);
        await this.load();
        this.guard(context);
        const space = this.storage.store.getState().spaces[run.scheduleId];
        if (!isScheduleSpace(space)) return undefined;
        const definition = getScheduleDefinition(space, this.localTimezone());
        if (!definition || definition.timingRevision !== run.timingRevision || !definition.enabled) return undefined;
        const details = space.schedule;
        return {
            id: space.id,
            timingRevision: definition.timingRevision,
            prompt: details.instructions,
            name: details.name,
            notifyOnComplete: details.notifyOnComplete,
            connectorIds: details.connectors.map(({ id }) => id),
            autoApprove: details.autoApprove,
        };
    }
}
