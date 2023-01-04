import { c } from 'ttag';

import DrawerAppButton, { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { Optional } from '@proton/shared/lib/interfaces';

import { ContactsDrawerLogo } from '../drawerIcons';

const ContactDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
    const { toggleDrawerApp } = useDrawer();

    const handleClick = () => {
        onClick?.();
        toggleDrawerApp({ app: APPS.PROTONCONTACTS })();
    };

    return (
        <DrawerAppButton
            key="toggle-contacts-drawer-app-button"
            tooltipText={c('Title').t`Contacts`}
            data-testid="contacts-drawer-app-button:contacts-icon"
            buttonContent={<ContactsDrawerLogo />}
            onClick={handleClick}
            {...rest}
        />
    );
};

export default ContactDrawerAppButton;
