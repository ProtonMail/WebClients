import clsx from '@proton/utils/clsx';

import './CalendarSelect.scss';

interface Props {
    color: string;
    className?: string;
    large?: boolean;
    border?: boolean;
}

const CalendarSelectIcon = ({ color, className, large, border }: Props) => {
    return (
        <div
            className={clsx([
                'calendar-select-color',
                large && 'calendar-select-color--large',
                border && 'calendar-select-color--bordered',
                className,
            ])}
            style={{ [border ? 'borderColor' : 'backgroundColor']: color }}
        />
    );
};

export default CalendarSelectIcon;
