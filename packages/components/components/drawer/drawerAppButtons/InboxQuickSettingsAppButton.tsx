import { c } from 'ttag';

import { ThemeColor } from '@proton/colors/types';
import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import Icon from '@proton/components/components/icon/Icon';
import { useDrawer } from '@proton/components/hooks';
import useQuickSettingsReminders from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

// Required to avoid showing desktop app spotlight on other apps
const InboxQuickSettingsAppButton = ({
    onClick,
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();

    const reminders = useQuickSettingsReminders();

    const notificationDotColor = [ThemeColor.Danger, ThemeColor.Warning].find((color) => reminders.includes(color));

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.QUICK_SETTINGS })();
    };

    return (
        <DrawerAppButton
            key="toggle-settings-drawer-app-button"
            tooltipText={c('Title').t`Settings`}
            tooltipPlacement="bottom"
            data-testid="settings-drawer-app-button:settings-icon"
            buttonContent={<Icon name="cog-drawer" size={5} />}
            onClick={handleClick}
            alt={c('Action').t`Toggle settings`}
            aria-controls="drawer-app-proton-settings"
            notificationDotColor={notificationDotColor}
        />
    );
};

export default InboxQuickSettingsAppButton;
