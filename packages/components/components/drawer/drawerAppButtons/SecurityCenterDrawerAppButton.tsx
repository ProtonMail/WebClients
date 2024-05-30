import { c } from 'ttag';

import { ThemeColor } from '@proton/colors/types';
import DrawerAppButton, { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useFlag } from '@proton/components/containers';
import { useDrawer } from '@proton/components/hooks';
import { baseUseSelector } from '@proton/redux-shared-store/sharedContext';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { Optional } from '@proton/shared/lib/interfaces';

import { SecurityCenterDrawerLogo } from '../drawerIcons';
import {
    selectAccountSecurityIssuesCount,
    selectHasAccountSecurityIssue,
} from '../views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
import { selectUnreadBreachesCount } from '../views/SecurityCenter/BreachAlerts/slice/breachNotificationsSlice';
import BreachAlertsSpotlight from '../views/SecurityCenter/BreachAlertsSpotlight';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';

const SecurityCenterDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();
    const isSecurityCenterEnabled = useSecurityCenter();
    const hasAccountSecurityWarning = baseUseSelector(selectHasAccountSecurityIssue);
    const accountSecurityCardsCount = baseUseSelector(selectAccountSecurityIssuesCount);
    const unreadBreachesCount = baseUseSelector(selectUnreadBreachesCount) || 0;
    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');

    const notificationCount = accountSecurityCardsCount + unreadBreachesCount;

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER })();
    };

    if (!isSecurityCenterEnabled) {
        return null;
    }

    return (
        <BreachAlertsSpotlight>
            <DrawerAppButton
                tooltipText={c('Title').t`Security center`}
                data-testid="security-center-drawer-app-button:security-center-icon"
                buttonContent={<SecurityCenterDrawerLogo />}
                onClick={handleClick}
                alt={c('Action').t`Toggle security center app`}
                aria-controls="drawer-app-proton-security-center"
                notificationDotColor={
                    hasAccountSecurityWarning || !!unreadBreachesCount ? ThemeColor.Warning : undefined
                }
                notificationDotCounter={canDisplayBreachNotifications ? notificationCount : undefined}
                {...rest}
            />
        </BreachAlertsSpotlight>
    );
};

export default SecurityCenterDrawerAppButton;
