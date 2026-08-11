import { c } from 'ttag';

import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import useDrawer from '../../../hooks/drawer/useDrawer';
import LumoDrawerLogo from '../drawerIcons/LumoDrawerLogo';

const LumoDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.LUMO })();
    };

    return (
        <DrawerAppButton
            tooltipText={LUMO_SHORT_APP_NAME}
            data-testid="lumo-drawer-app-button:lumo-icon"
            buttonContent={<LumoDrawerLogo className="m-1" />}
            onClick={handleClick}
            alt={c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}
            aria-controls="drawer-app-lumo"
            {...rest}
        />
    );
};

export default LumoDrawerAppButton;
