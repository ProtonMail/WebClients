import { useEffect, useReducer } from 'react';

import { clsx } from 'clsx';

import { MINUTE } from '@proton/shared/lib/constants';

import type { RecurrenceRule } from '../../../components/RecurrenceRuleFieldset/types';
import { useScheduleRunState } from '../useScheduleRunState';
import { getScheduleNextRunLabel, getScheduleRunLabel } from './utils/run-label';

interface ScheduleRunSecondaryLabelProps {
    className?: string;
    rule: RecurrenceRule;
    scheduleId: string;
}

/**
 * Displays queue position, elapsed run time, or pause guidance, falling back to the next-run countdown. Refreshes at
 * minute boundaries.
 */
export const ScheduleRunSecondaryLabel = ({ className, rule, scheduleId }: ScheduleRunSecondaryLabelProps) => {
    const runState = useScheduleRunState(scheduleId);
    const [, forceUpdate] = useReducer((tick) => tick + 1, 0);

    useEffect(() => {
        // Refresh label at the start of each minute.
        let timer: ReturnType<typeof setTimeout>;
        const scheduleTick = () => {
            timer = setTimeout(
                () => {
                    forceUpdate();
                    scheduleTick();
                },
                MINUTE - (Date.now() % MINUTE)
            );
        };
        scheduleTick();
        return () => clearTimeout(timer);
    }, []);

    const label = getScheduleRunLabel(runState) ?? getScheduleNextRunLabel(rule, new Date());

    return label ? <span className={clsx('flex-1 min-w-0 text-ellipsis', className)}>{label}</span> : null;
};
