import { c } from 'ttag';

import DrawerAppButton, { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { APPS } from '@proton/shared/lib/constants';
import { Optional } from '@proton/shared/lib/interfaces';

import { useAppLink } from '../../link';
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
