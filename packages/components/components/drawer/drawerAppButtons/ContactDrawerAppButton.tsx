import { c } from 'ttag';

import { ContactsDrawerLogo } from '@proton/atoms/DrawerIcons';
import DrawerAppButton, { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { Optional } from '@proton/shared/lib/interfaces';

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
            buttonContent={<ContactsDrawerLogo />}
            onClick={handleClick}
            {...rest}
        />
    );
};

export default ContactDrawerAppButton;
