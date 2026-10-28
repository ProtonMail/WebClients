import { c } from 'ttag';

import type { RecurrenceRule } from '../../../components/RecurrenceRuleFieldset/types';
import { useScheduleRunState } from '../useScheduleRunState';
import { getScheduleShortCadenceLabel } from './utils/cadence-label';

const getStatusLabel = (isRunning: boolean, isPaused: boolean): string | undefined => {
    if (isRunning) {
        // translator: Sidebar label for a scheduled task whose execution is currently in progress.
        return c('collider_2025:Status').t`Running`;
    }
    if (isPaused) {
        // translator: Sidebar label for a scheduled task disabled until the user resumes it.
        return c('collider_2025:Status').t`Paused`;
    }
};

export const ScheduleSidebarLabel = ({ rule, scheduleId }: { rule: RecurrenceRule; scheduleId: string }) => {
    const { isRunning, isPaused } = useScheduleRunState(scheduleId);

    return (
        <span className="shrink-0 text-sm color-hint text-nowrap">
            {getStatusLabel(isRunning, isPaused) ?? getScheduleShortCadenceLabel(rule)}
        </span>
    );
};
