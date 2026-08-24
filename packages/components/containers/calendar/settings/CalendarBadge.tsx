import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { CalendarStatusBadge } from '@proton/shared/lib/calendar/badges';

import Badge from '../../../components/badge/Badge';

const CalendarBadge = ({ badgeType, text, tooltipText, className }: Omit<CalendarStatusBadge, 'statusType'>) => {
    return tooltipText ? (
        <Tooltip title={tooltipText}>
            <span className={className}>
                <Badge type={badgeType}>{text}</Badge>
            </span>
        </Tooltip>
    ) : (
        <Badge className={className} type={badgeType}>
            {text}
        </Badge>
    );
};

export default CalendarBadge;
