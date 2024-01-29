import { c } from 'ttag';

import { ThemeColor } from '@proton/colors/types';
import DrawerAppButton, { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { baseUseSelector } from '@proton/redux-shared-store';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { Optional } from '@proton/shared/lib/interfaces';

import { SecurityCenterDrawerLogo } from '../drawerIcons';
import { selectAccountSecurityIssuesCount } from '../views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
import SecurityCenterSpotlight from '../views/SecurityCenter/SecurityCenterSpotlight';
import useSecurityCenter from '../views/SecurityCenter/useSecurityCenter';

const SecurityCenterDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();
    const isSecurityCenterEnabled = useSecurityCenter();
    const issuesCount = baseUseSelector(selectAccountSecurityIssuesCount);

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER })();
    };

    if (!isSecurityCenterEnabled) {
        return null;
    }

    return (
        <SecurityCenterSpotlight>
            <DrawerAppButton
                tooltipText={c('Title').t`Security center`}
                data-testid="security-center-drawer-app-button:security-center-icon"
                buttonContent={<SecurityCenterDrawerLogo />}
                onClick={handleClick}
                alt={c('Action').t`Toggle security center app`}
                aria-controls="drawer-app-proton-security-center"
                notificationDotColor={issuesCount > 0 ? ThemeColor.Danger : undefined}
                notificationDotCounter={issuesCount}
                {...rest}
            />
        </SecurityCenterSpotlight>
    );
};

export default SecurityCenterDrawerAppButton;
