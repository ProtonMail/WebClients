import { c } from 'ttag';

import {
    selectAccountSecurityElements,
    selectAccountSecurityIssuesCount,
    selectCanDisplayAccountSecuritySection,
    selectHasAccountSecurityIssue,
} from '@proton/account/accountSecurity/accountSecuritySlice';
import { selectUnreadBreachesCount } from '@proton/account/breaches/breachNotificationsSlice';
import { ThemeColor } from '@proton/colors/types';
import { baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces/utils';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import useDrawer from '../../../hooks/drawer/useDrawer';
import SecurityCenterDrawerLogo from '../drawerIcons/SecurityCenterDrawerLogo';
import BreachAlertsSpotlight from '../views/SecurityCenter/BreachAlertsSpotlight';
import SecurityCenterAliasSpotlight from '../views/SecurityCenter/SecurityCenterAliasSpotlight';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';
import type { Props } from './DrawerAppButton';
import DrawerAppButton from './DrawerAppButton';

interface SecurityCenterDrawerAppButtonProps extends Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'> {
    showAliasSpotlight?: boolean;
    onAliasSpotlightClose?: () => void;
    onAliasSpotlightDisplayed?: () => void;
}

const SecurityCenterDrawerAppButton = ({
    onClick,
    showAliasSpotlight = false,
    onAliasSpotlightClose = noop,
    onAliasSpotlightDisplayed,
    ...rest
}: SecurityCenterDrawerAppButtonProps) => {
    const { toggleDrawerApp } = useDrawer();
    const isSecurityCenterEnabled = useSecurityCenter();
    const hasAccountSecurityWarning = baseUseSelector(selectHasAccountSecurityIssue);
    const accountSecurityCardsCount = baseUseSelector(selectAccountSecurityIssuesCount);
    const unreadBreachesCount = baseUseSelector(selectUnreadBreachesCount) || 0;
    const { recoveryPhraseSet, hasSentinelEnabled } = baseUseSelector(selectAccountSecurityElements);
    const canDisplayAccountSecurity = baseUseSelector(selectCanDisplayAccountSecuritySection);

    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');

    const getNotificationCount = () => {
        if (hasSentinelEnabled) {
            return canDisplayAccountSecurity && !recoveryPhraseSet ? unreadBreachesCount + 1 : unreadBreachesCount;
        }
        return accountSecurityCardsCount + unreadBreachesCount;
    };
    const getNotificationDotColor = () => {
        if (hasSentinelEnabled && canDisplayAccountSecurity && !recoveryPhraseSet) {
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
        <BreachAlertsSpotlight replaced={showAliasSpotlight}>
            <SecurityCenterAliasSpotlight
                show={showAliasSpotlight}
                onClose={onAliasSpotlightClose}
                onDisplayed={onAliasSpotlightDisplayed}
            >
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
            </SecurityCenterAliasSpotlight>
        </BreachAlertsSpotlight>
    );
};

export default SecurityCenterDrawerAppButton;
