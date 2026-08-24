import { c } from 'ttag';

import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import { useReferralDiscover } from '../../../containers/referral/hooks/useReferralDiscover';
import useDrawer from '../../../hooks/drawer/useDrawer';
import ReferralDrawerLogo from '../drawerIcons/ReferralDrawerLogo';
import type { Props } from './DrawerAppButton';
import DrawerAppButton from './DrawerAppButton';

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
