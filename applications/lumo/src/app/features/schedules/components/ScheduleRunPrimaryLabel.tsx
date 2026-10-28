import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ALWAYS_LOCAL_TIMEZONE_ID, type RecurrenceRule } from '../../../components/RecurrenceRuleFieldset/types';
import { useScheduleRunState } from '../useScheduleRunState';
import { getScheduleCadenceLabel } from './utils/cadence-label';

import './ScheduleRunPrimaryLabel.scss';

const getScheduleStatusLabel = ({
    isQueued,
    isRunning,
    isPaused,
}: {
    isQueued: boolean;
    isRunning: boolean;
    isPaused: boolean;
}): string | undefined => {
    if (isQueued) {
        // translator: Scheduled task status indicating that execution is pending to run.
        return c('collider_2025:Status').t`Running soon…`;
    }
    if (isRunning) {
        // translator: Scheduled task status indicating that execution is currently in progress.
        return c('collider_2025:Status').t`Running now…`;
    }
    if (isPaused) {
        // translator: Scheduled task status indicating that the schedule is disabled until the user resumes it.
        return c('collider_2025:Status').t`Paused`;
    }
};

interface ScheduleRunPrimaryLabelProps {
    rule: RecurrenceRule;
    scheduleId: string;
    chip?: boolean;
}

/**
 * Displays primary label text for a scheduled task, including running or paused status, falling back to the schedule's
 * cadence label.
 */
export const ScheduleRunPrimaryLabel = ({ rule, scheduleId, chip = false }: ScheduleRunPrimaryLabelProps) => {
    const [userSettings] = useUserSettings();
    const { isQueued, isRunning, isPaused } = useScheduleRunState(scheduleId);
    const cadenceLabel = getScheduleCadenceLabel(rule, getWeekStartsOn(userSettings));
    const statusLabel = getScheduleStatusLabel({ isQueued, isRunning, isPaused });
    const showGlobeIcon = !isPaused && rule.timezone !== ALWAYS_LOCAL_TIMEZONE_ID;
    const isActive = isRunning || isQueued;

    return (
        <Tooltip
            title={rule.timezone === ALWAYS_LOCAL_TIMEZONE_ID ? cadenceLabel : `${cadenceLabel} (${rule.timezone})`}
        >
            <span
                className={clsx('schedule-run-primary-label inline-flex flex-nowrap items-center gap-1 min-w-0', {
                    'schedule-run-primary-label--chip text-sm': chip,
                    'schedule-run-primary-label--active': isActive,
                    'schedule-run-primary-label--paused': isPaused && !isActive,
                })}
            >
                {isPaused && <LumoIcon aria-hidden className="shrink-0" name="Pause" size={12} />}
                {showGlobeIcon && <LumoIcon aria-hidden className="shrink-0" name="Globe" size={12} />}
                <span className="min-w-0 text-ellipsis">{statusLabel ?? cadenceLabel}</span>
            </span>
        </Tooltip>
    );
};
