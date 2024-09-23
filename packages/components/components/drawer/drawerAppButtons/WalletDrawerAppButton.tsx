import { c } from 'ttag';

import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import useAppLink from '@proton/components/components/link/useAppLink';
import { APPS } from '@proton/shared/lib/constants';
import type { Optional } from '@proton/shared/lib/interfaces';

import { WalletDrawerLogo } from '../drawerIcons';

const WalletDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const goToApp = useAppLink();
    const handleClick = () => {
        goToApp('/', APPS.PROTONWALLET, true);
    };
    return (
        <DrawerAppButton
            key="open-wallet-drawer-app-button"
            tooltipText={c('wallet_signup_2024:Title').t`Wallet`}
            data-testid="wallet-drawer-app-button:wallet-icon"
            buttonContent={<WalletDrawerLogo />}
            onClick={handleClick}
            alt={c('wallet_signup_2024:Action').t`Access Wallet app`}
            aria-controls="drawer-app-proton-wallet"
            {...rest}
        />
    );
};

export default WalletDrawerAppButton;
