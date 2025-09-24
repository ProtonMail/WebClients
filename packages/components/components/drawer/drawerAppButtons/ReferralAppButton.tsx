import { c } from 'ttag';

import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useReferralDiscover } from '@proton/components/containers/referral/hooks/useReferralDiscover';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import useDrawer from '../../../hooks/drawer/useDrawer';
import ReferralDrawerLogo from '../drawerIcons/ReferralDrawerLogo';

const ReferralAppButton = ({ onClick, ...rest }: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();
    const { canShowDrawerApp } = useReferralDiscover();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.REFERRAL })();
    };

    if (!canShowDrawerApp) {
        return null;
    }

    return (
        <DrawerAppButton
            key="toggle-referral-drawer-app-button"
            tooltipText={c('Title').t`Referral`}
            data-testid="referral-drawer-app-button:referral-icon"
            buttonContent={<ReferralDrawerLogo />}
            onClick={handleClick}
            alt={c('Action').t`Toggle referral`}
            aria-controls="drawer-app-proton-referral"
            {...rest}
        />
    );
};

export default ReferralAppButton;
