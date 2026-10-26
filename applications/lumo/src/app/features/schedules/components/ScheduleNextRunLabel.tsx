import { useState } from 'react';

import { clsx } from 'clsx';

import useInterval from '@proton/hooks/useInterval';
import { MINUTE } from '@proton/shared/lib/constants';

import type { RecurrenceRule } from '../../../components/RecurrenceRuleFieldset/types';
import { getScheduleNextRunLabel } from './utils/next-run';

interface ScheduleNextRunLabelProps {
    className?: string;
    rule: RecurrenceRule;
}

export const ScheduleNextRunLabel = ({ className, rule }: ScheduleNextRunLabelProps) => {
    const [now, setNow] = useState(() => new Date());
    useInterval(() => setNow(new Date()), MINUTE);

    const label = getScheduleNextRunLabel(rule, now);

    return label ? <span className={clsx('flex-1 min-w-0 text-ellipsis', className)}>{label}</span> : null;
};
