import tinycolor from 'tinycolor2';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    color?: string;
    className?: string;
}
const CalendarIcon = ({ color, className }: Props) => {
    const colorModel = tinycolor(color);
    const iconColor = colorModel?.isValid() ? colorModel?.toHexString() : '';
    if (!iconColor) {
        return null;
    }
    return <Icon className={clsx(['shrink-0', className])} name="calendar-grid" color={iconColor} />;
};

export default CalendarIcon;
