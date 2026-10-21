import { useState } from 'react';

import useInterval from '@proton/hooks/useInterval';
import { MINUTE } from '@proton/shared/lib/constants';

import type { RecurrenceRule } from '../../../components/RecurrenceRuleFieldset/types';
import { getScheduleNextRunLabel } from './utils/next-run';

export const ScheduleNextRunLabel = ({ rule }: { rule: RecurrenceRule }) => {
    const [now, setNow] = useState(() => new Date());
    useInterval(() => setNow(new Date()), MINUTE);

    const label = getScheduleNextRunLabel(rule, now);
    return label ? <span className="flex-1 min-w-0 text-sm text-ellipsis color-weak">{label}</span> : null;
};
