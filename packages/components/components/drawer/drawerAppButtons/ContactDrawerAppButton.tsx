import { c } from 'ttag';

import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import type { Optional } from '@proton/shared/lib/interfaces';

import useDrawer from '../../../hooks/drawer/useDrawer';
import ContactsDrawerLogo from '../drawerIcons/ContactsDrawerLogo';
import type { Props } from './DrawerAppButton';
import DrawerAppButton from './DrawerAppButton';

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
            alt={c('Action').t`Toggle Contacts app`}
            aria-controls="drawer-app-proton-contact"
            {...rest}
        />
    );
};

export default ContactDrawerAppButton;
