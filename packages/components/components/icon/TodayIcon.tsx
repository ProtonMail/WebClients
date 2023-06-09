import clsx from '@proton/utils/clsx';

import './_today-icon.scss';

interface Props {
    todayDate: number;
    className?: string;
}
const TodayIcon = ({ todayDate, className }: Props) => {
    return <span className={clsx(['today-icon', className])}>{todayDate}</span>;
};

export default TodayIcon;
