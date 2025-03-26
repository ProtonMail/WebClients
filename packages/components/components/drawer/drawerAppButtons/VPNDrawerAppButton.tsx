import { c } from 'ttag';

import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import useDrawer from '../../../hooks/drawer/useDrawer';
import VPNDrawerLogo from '../drawerIcons/VPNDrawerLogo';
import VPNDrawerSpotlight from '../views/vpn/VPNDrawerSpotlight';
import useVPNDrawer from '../views/vpn/useVPNDrawer';

const VPNDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();
    const isVPNDrawerEnabled = useVPNDrawer();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.VPN })();
    };

    if (!isVPNDrawerEnabled) {
        return null;
    }

    return (
        <VPNDrawerSpotlight>
            <DrawerAppButton
                tooltipText={VPN_APP_NAME}
                data-testid="vpn-drawer-app-button:vpn-icon"
                buttonContent={<VPNDrawerLogo />}
                onClick={handleClick}
                alt={c('Action').t`Toggle VPN dashboard`}
                aria-controls="drawer-app-proton-vpn"
                {...rest}
            />
        </VPNDrawerSpotlight>
    );
};

export default VPNDrawerAppButton;
