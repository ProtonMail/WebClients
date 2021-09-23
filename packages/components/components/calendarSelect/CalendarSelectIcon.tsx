import { classnames } from '../../helpers';
import './CalendarSelect.scss';

interface Props {
    color: string;
    className?: string;
}

const CalendarSelectIcon = ({ color, className }: Props) => {
    return <div className={classnames(['calendar-select-color', className])} style={{ backgroundColor: color }} />;
};

export default CalendarSelectIcon;
