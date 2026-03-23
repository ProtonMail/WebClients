import tinycolor from 'tinycolor2';

import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
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
    return <IcCalendarGrid className={clsx(['shrink-0', className])} color={iconColor} />;
};

export default CalendarIcon;
