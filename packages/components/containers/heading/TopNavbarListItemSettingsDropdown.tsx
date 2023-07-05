import { ComponentPropsWithoutRef, ReactNode, forwardRef } from 'react';

import { c } from 'ttag';

import { ThemeColor } from '@proton/colors/types';

import { AppLink, DropdownMenu, DropdownMenuButton, DropdownMenuLink, DropdownSizeUnit, Icon } from '../../components';
import SimpleDropdown from '../../components/dropdown/SimpleDropdown';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import { useEarlyAccess, useModals } from '../../hooks';
import EarlyAccessModal from '../earlyAccess/EarlyAccessModal';
import { useTheme } from '../themes';
import ThemesModal from '../themes/ThemesModal';

const TopNavbarListItemSettingsButtonBase = (
    props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>,
    ref: typeof props.ref
) => {
    return (
        <TopNavbarListItemButton
            {...props}
            ref={ref}
            type="button"
            as="button"
            data-testid="view:general-settings"
            icon={<Icon name="cog-wheel" />}
            text={c('Text').t`Settings`}
            title={c('Title').t`Open settings menu`}
        />
    );
};

const TopNavbarListItemSettingsButton = forwardRef(TopNavbarListItemSettingsButtonBase);

interface Props extends ComponentPropsWithoutRef<typeof AppLink> {
    children?: ReactNode;
    notificationDotColor?: ThemeColor;
}

const TopNavbarListItemSettingsDropdown = (props: Props) => {
    const { createModal } = useModals();
    const earlyAccess = useEarlyAccess();
    const theme = useTheme();

    const handleEarlyAccessClick = () => {
        createModal(<EarlyAccessModal />);
    };

    const handleThemeClick = () => {
        createModal(<ThemesModal />);
    };

    const { to, toApp, children, notificationDotColor } = props;

    return (
        <SimpleDropdown
            as={TopNavbarListItemSettingsButton}
            originalPlacement="bottom-start"
            hasCaret={false}
            dropdownStyle={{ '--min-width': '18em' }}
            notificationDotColor={notificationDotColor}
            dropdownSize={{ maxHeight: DropdownSizeUnit.Viewport }}
        >
            <DropdownMenu>
                <DropdownMenuLink as={AppLink} to={to} toApp={toApp} target="_self">
                    {c('Action').t`Go to settings`}
                </DropdownMenuLink>

                <hr className="my-2" />

                <DropdownMenuButton
                    onClick={handleEarlyAccessClick}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Beta Access`}</span>
                    <span className="color-primary ml-2">
                        {earlyAccess.value ? c('Early Access Enabled').t`On` : c('Early Access Disabled').t`Off`}
                    </span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    onClick={handleThemeClick}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Theme`}</span>
                    <span className="color-primary ml-2">{theme.information.label}</span>
                </DropdownMenuButton>
                {children}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default TopNavbarListItemSettingsDropdown;
