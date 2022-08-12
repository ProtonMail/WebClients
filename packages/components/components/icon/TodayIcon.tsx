import { classnames } from '../../helpers';

import './_today-icon.scss';

interface Props {
    todayDate: number;
    className?: string;
}
const TodayIcon = ({ todayDate, className }: Props) => {
    return <span className={classnames(['today-icon', className])}>{todayDate}</span>;
};

export default TodayIcon;
