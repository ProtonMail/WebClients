import { CalendarStatusBadge } from '@proton/shared/lib/calendar/badges';
import { Badge, Tooltip } from '@proton/components/components';
import React from 'react';

const CalendarBadge = ({ badgeType, text, tooltipText }: Omit<CalendarStatusBadge, 'statusType'>) => {
    return tooltipText ? (
        <Tooltip title={tooltipText}>
            <span>
                <Badge type={badgeType}>{text}</Badge>
            </span>
        </Tooltip>
    ) : (
        <Badge type={badgeType}>{text}</Badge>
    );
};

export default CalendarBadge;
