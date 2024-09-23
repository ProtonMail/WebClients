import { c } from 'ttag';

import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import ContactsDrawerLogo from '../drawerIcons/ContactsDrawerLogo';

const ContactDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.CONTACTS })();
    };

    return (
        <DrawerAppButton
            key="toggle-contacts-drawer-app-button"
            tooltipText={c('Title').t`Contacts`}
            data-testid="contacts-drawer-app-button:contacts-icon"
            buttonContent={<ContactsDrawerLogo />}
            onClick={handleClick}
            alt={c('Action').t`Toggle Contact app`}
            aria-controls="drawer-app-proton-contact"
            {...rest}
        />
    );
};

export default ContactDrawerAppButton;
