import { c } from 'ttag';

import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import useDynamicMonthDay from '@proton/components/hooks/useDynamicMonthDay';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import type { Optional } from '@proton/shared/lib/interfaces';

import CalendarDrawerLogo from '../drawerIcons/CalendarDrawerLogo';

const CalendarDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();
    const monthDay = useDynamicMonthDay();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: APPS.PROTONCALENDAR })();
    };

    return (
        <DrawerAppButton
            key="toggle-calendar-drawer-app-button"
            tooltipText={CALENDAR_APP_NAME}
            data-testid="calendar-drawer-app-button:calendar-icon"
            buttonContent={<CalendarDrawerLogo monthDay={monthDay} />}
            onClick={handleClick}
            alt={c('Action').t`Toggle Calendar app`}
            aria-controls="drawer-app-iframe-proton-calendar"
            {...rest}
        />
    );
};

export default CalendarDrawerAppButton;
