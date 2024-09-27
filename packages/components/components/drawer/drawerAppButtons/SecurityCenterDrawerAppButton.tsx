import { c } from 'ttag';

import { ThemeColor } from '@proton/colors/types';
import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { baseUseSelector } from '@proton/react-redux-store';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import SecurityCenterDrawerLogo from '../drawerIcons/SecurityCenterDrawerLogo';
import {
    selectAccountSecurityElements,
    selectAccountSecurityIssuesCount,
    selectHasAccountSecurityIssue,
} from '../views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
import { selectCanDisplayAccountSecuritySection } from '../views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
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
    const { recoveryPhraseSet, hasSentinelEnabled } = baseUseSelector(selectAccountSecurityElements);
    const canDisplayAccountSecurity = baseUseSelector(selectCanDisplayAccountSecuritySection);

    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');
    const canDisplayNewSentinelSettings = useFlag('SentinelRecoverySettings');

    const getNotificationCount = () => {
        if (canDisplayNewSentinelSettings && hasSentinelEnabled) {
            return canDisplayAccountSecurity && !recoveryPhraseSet ? unreadBreachesCount + 1 : unreadBreachesCount;
        }
        return accountSecurityCardsCount + unreadBreachesCount;
    };
    const getNotificationDotColor = () => {
        if (hasSentinelEnabled && canDisplayAccountSecurity && !recoveryPhraseSet && canDisplayNewSentinelSettings) {
            return ThemeColor.Danger;
        }
        if (hasAccountSecurityWarning || !!unreadBreachesCount) {
            return ThemeColor.Warning;
        }
        return undefined;
    };

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
                notificationDotColor={getNotificationDotColor()}
                notificationDotCounter={canDisplayBreachNotifications ? getNotificationCount() : undefined}
                {...rest}
            />
        </BreachAlertsSpotlight>
    );
};

export default SecurityCenterDrawerAppButton;
