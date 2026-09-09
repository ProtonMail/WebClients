import { c } from 'ttag';

import type { IconSize } from '@proton/icons/types';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import useDrawer from '../../../hooks/drawer/useDrawer';
import LumoDrawerLogo from '../drawerIcons/LumoDrawerLogo';
import type { Props } from './DrawerAppButton';
import DrawerAppButton from './DrawerAppButton';

interface LumoProps extends Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'> {
    /** Omit to keep the glyph at its drawer-sidebar size. */
    logoSize?: IconSize;
}

const LumoDrawerAppButton = ({ onClick, logoSize, ...rest }: LumoProps) => {
    const { toggleDrawerApp } = useDrawer();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.LUMO })();
    };

    return (
        <DrawerAppButton
            tooltipText={LUMO_SHORT_APP_NAME}
            data-testid="lumo-drawer-app-button:lumo-icon"
            buttonContent={<LumoDrawerLogo size={logoSize} className="m-1" />}
            onClick={handleClick}
            alt={c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}
            aria-controls="drawer-app-lumo"
            {...rest}
        />
    );
};

export default LumoDrawerAppButton;
