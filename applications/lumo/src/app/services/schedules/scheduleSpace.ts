import isEqual from 'lodash/isEqual';

import type { ScheduleDefinition } from '@proton/lumo-api-client/core/desktop-schedules';

import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../components/RecurrenceRuleFieldset/types';
import { generateSpaceKeyBase64 } from '../../crypto';
import type { ScheduleDetails } from '../../features/schedules/types';
import { type ScheduleSpace, type Space, SpaceType } from '../../types';
import { toDesktopTiming } from './localTiming';

/** Builds a schedule space with the execution metadata persisted by the editor. */
export function createScheduleSpace(
    id: string,
    details: ScheduleDetails,
    previous?: Space,
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
): Space {
    if (previous && previous.spaceType !== SpaceType.Schedule) throw new Error('This space is not a scheduled task');
    const prior = previous?.scheduleDefinition;
    const changed = !!previous && !isEqual(previous.schedule.recurrenceRule, details.recurrenceRule);
    const now = new Date().toISOString();
    return {
        id,
        spaceType: SpaceType.Schedule,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        spaceKey: previous?.spaceKey ?? generateSpaceKeyBase64(),
        schedule: structuredClone(details),
        scheduleDefinition: {
            id,
            timingRevision: (prior?.timingRevision ?? 1) + (changed ? 1 : 0),
            enabled: prior?.enabled ?? true,
            timing: prior && !changed ? prior.timing : toDesktopTiming(details.recurrenceRule, timezone),
            missedRunPolicy: prior?.missedRunPolicy ?? 'run_once',
        },
    };
}

/** Resolves persisted execution metadata for this desktop; absent metadata leaves a task unscheduled. */
export function getScheduleDefinition(space: ScheduleSpace, timezone: string): ScheduleDefinition | undefined {
    const rule = space.schedule.recurrenceRule;
    const stored = space.scheduleDefinition;
    if (!stored) return undefined;
    const timing =
        rule.timezone === ALWAYS_LOCAL_TIMEZONE_ID && rule.frequency !== 'ONCE'
            ? toDesktopTiming(rule, timezone)
            : stored.timing;
    return {
        ...stored,
        timing,
    };
}
