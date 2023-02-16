import { Badge, Tooltip } from '@proton/components/components';
import { CalendarStatusBadge } from '@proton/shared/lib/calendar/badges';

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
