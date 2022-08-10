import clsx from '@proton/utils/clsx';

import './CalendarSelect.scss';

interface Props {
    color: string;
    className?: string;
    large?: boolean;
}

const CalendarSelectIcon = ({ color, className, large }: Props) => {
    return (
        <div
            className={clsx(['calendar-select-color', large && 'calendar-select-color--large', className])}
            style={{ backgroundColor: color }}
        />
    );
};

export default CalendarSelectIcon;
